// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSslStatus } from "../../../lib/domainIntel";
import { fetchHomepageIntel } from "../../../lib/fetchPageIntel";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const DEBUG = true;

async function safe<T>(label: string, promise: Promise<T>): Promise<T | null> {
  try {
    const val = await promise;
    if (DEBUG) console.log(`✅ ${label}`, JSON.stringify(val)?.slice(0, 800));
    return val;
  } catch (err: any) {
    console.error(`❌ ${label}`, err?.message || err);
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toRiskLevel(score: number): "Low" | "Moderate" | "High" {
  if (score >= 80) return "Low";
  if (score >= 55) return "Moderate";
  return "High";
}

/* ------------------------------------------------------------------
   Supplier Analyzer Scoring Logic
-------------------------------------------------------------------*/
function computeTrustScore(f: {
  https: boolean;
  sslValid: boolean;
  sslExpiryDays: number | null;
  hasContact: boolean | null;
  trustSignals: number | null;
  negativeSignals: number;
}) {
  let score = 50;
  score += f.https ? 8 : -10;
  score += f.sslValid ? 8 : -12;

  if (typeof f.sslExpiryDays === "number") {
    if (f.sslExpiryDays > 365) score += 3;
    else if (f.sslExpiryDays > 90) score += 1;
  }

  if (f.hasContact === true) score += 6;
  else if (f.hasContact === false) score -= 6;

  if (typeof f.trustSignals === "number") {
    if (f.trustSignals >= 0.8) score += 12;
    else if (f.trustSignals >= 0.5) score += 6;
    else if (f.trustSignals < 0.2) score -= 8;
  }

  score -= Math.min(f.negativeSignals, 5) * 10;
  return clamp(Math.round(score), 5, 95);
}

/* ------------------------------------------------------------------
   Supplier Analyzer Prompt
-------------------------------------------------------------------*/
function buildSupplierAnalyzerPrompt(args: {
  url: string;
  domain: string;
  https: boolean;
  features: {
    sslValid: boolean;
    sslExpiryDays: number | null;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    hasContact: boolean | null;
    trustSignals: number | null;
    sampleText?: string | null;
  };
  score: number;
}) {
  const f = args.features;
  const facts = [
    `URL: ${args.url}`,
    `Domain: ${args.domain}`,
    `HTTPS: ${args.https}`,
    `SSL valid: ${f.sslValid}`,
    `SSL expiry days: ${f.sslExpiryDays ?? "unknown"}`,
    `Title: ${f.title ?? "n/a"}`,
    `Meta: ${f.metaDescription ?? "n/a"}`,
    `H1: ${f.h1 ?? "n/a"}`,
    `Has contact info: ${f.hasContact ?? "unknown"}`,
    `Trust signals (0..1): ${f.trustSignals ?? 0}`,
    `Deterministic score: ${args.score}`,
    `Homepage text sample: ${f.sampleText?.slice(0, 400) ?? "none"}`,
  ].join("\n");

  return [
    {
      role: "system" as const,
      content: `You are an expert supplier trust evaluator for liquidation and wholesale websites.
Be factual and balanced — many legitimate resellers have simple websites with minimal branding.
Be critical of sites that promise unrealistic profits, use vague company info, or hide contact details.
Return JSON:
{ "trust_score": number, "risk_level": "Low"|"Moderate"|"High", "summary": string, "positives": string[], "red_flags": string[] }`,
    },
    {
      role: "user" as const,
      content: `Evaluate the supplier based on the following info:\n${facts}\n\nAssess credibility fairly — do not penalize simplicity if it looks like a genuine liquidation supplier.`,
    },
  ];
}

/* ------------------------------------------------------------------
   Main Handler
-------------------------------------------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tool = body?.tool;
    const input = (body?.input ?? "").trim();

    /* === 🧠 AI Mentor Chat === */
    if (tool === "ai-mentor") {
      if (!input)
        return NextResponse.json({ error: "Missing input" }, { status: 400 });

      const mentorPrompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are "AI Reseller Mentor", a motivational and skilled expert in live selling, Whatnot growth, sourcing suppliers, pricing, and profit scaling. 
Be concise, encouraging, and provide actionable, real-world reseller strategies.`,
        },
        {
          role: "user",
          content: input,
        },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: mentorPrompt,
      });

      const reply =
        completion.choices?.[0]?.message?.content ||
        "Sorry, I couldn’t generate a response.";

      return NextResponse.json({ ok: true, tool, reply });
    }

    /* === 🔍 Supplier Analyzer === */
    if (tool === "supplier-analyzer") {
      if (!/^https?:\/\/\S+/i.test(input))
        return NextResponse.json(
          { error: "Provide full URL including http(s)://" },
          { status: 400 }
        );

      const https = input.startsWith("https://");
      const domain = input.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

      const ssl = await safe("SSL", getSslStatus(domain));
      const homepage = await safe("HOMEPAGE", fetchHomepageIntel(input));

      const title = (homepage as any)?.title ?? (homepage as any)?.meta?.title ?? null;
      const metaDescription =
        (homepage as any)?.metaDescription ?? (homepage as any)?.meta?.metaDesc ?? null;
      const h1 = (homepage as any)?.h1 ?? null;
      const hasContact = (homepage as any)?.hasContact ?? null;
      const trustSignals = (homepage as any)?.trustSignals ?? 0;
      const sampleText = (homepage as any)?.sampleText ?? "";

      const features = {
        sslValid: !!ssl?.sslValid,
        sslExpiryDays: ssl?.sslDaysRemaining ?? null,
        title,
        metaDescription,
        h1,
        hasContact,
        trustSignals,
        sampleText,
      };

      const preScore = computeTrustScore({
        https,
        sslValid: features.sslValid,
        sslExpiryDays: features.sslExpiryDays,
        hasContact: features.hasContact,
        trustSignals: features.trustSignals,
        negativeSignals: 0,
      });

      const messages = buildSupplierAnalyzerPrompt({
        url: input,
        domain,
        https,
        features,
        score: preScore,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages,
      });

      let aiOut: any = {};
      try {
        aiOut = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
      } catch {
        aiOut = {
          trust_score: preScore,
          risk_level: toRiskLevel(preScore),
          summary: "Parsing fallback",
          positives: [],
          red_flags: [],
        };
      }

      const finalScore = clamp(
        Math.round(preScore * 0.6 + (aiOut.trust_score || preScore) * 0.4),
        5,
        95
      );
      const finalLevel = toRiskLevel(finalScore);

      return NextResponse.json({
        ok: true,
        tool,
        data: {
          trust_score: finalScore,
          risk_level: finalLevel,
          summary:
            aiOut.summary ||
            "Balanced assessment based on reseller-oriented credibility factors.",
          positives: aiOut.positives || [],
          red_flags: aiOut.red_flags || [],
          notes: ["v5 reseller-calibrated scoring"],
        },
      });
    }

    return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
  } catch (err: any) {
    console.error("AI Tools API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
















