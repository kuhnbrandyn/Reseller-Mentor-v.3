// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSslStatus } from "../../../lib/domainIntel";
import { fetchHomepageIntel } from "../../../lib/fetchPageIntel";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------------------------------------------------------
   1️⃣ Helpers
-------------------------------------------------------------------*/
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
  if (score >= 50) return "Moderate";
  return "High";
}

/* ------------------------------------------------------------------
   2️⃣ Improved Deterministic Scoring — realistic spread
-------------------------------------------------------------------*/
function computeTrustScore(f: {
  https: boolean;
  sslValid: boolean;
  sslExpiryDays: number | null;
  hasContact: boolean | null;
  trustSignals: number | null;
  negativeSignals: number;
}) {
  let score = 40; // base lowered for realism

  // HTTPS / SSL
  score += f.https ? 8 : -10;
  score += f.sslValid ? 10 : -12;
  if (typeof f.sslExpiryDays === "number") {
    if (f.sslExpiryDays > 365) score += 3;
    else if (f.sslExpiryDays > 90) score += 1;
  }

  // Contact Info Presence
  if (f.hasContact === false) score -= 12;
  else if (f.hasContact === true) score += 6;

  // Trust Signals
  if (typeof f.trustSignals === "number") {
    if (f.trustSignals >= 0.8) score += 10;
    else if (f.trustSignals >= 0.5) score += 5;
    else if (f.trustSignals < 0.2) score -= 15;
  }

  // Negatives (e.g., scammy language, missing transparency)
  score -= Math.min(f.negativeSignals, 5) * 10;

  // Range cap
  return clamp(Math.round(score), 5, 95);
}

/* ------------------------------------------------------------------
   3️⃣ GPT Prompt builder (smarter + more skeptical)
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
      role: "system",
      content: `You are an expert supplier trust evaluator for online resellers. 
Be concise, critical, and skeptical of unrealistic claims or missing transparency. 
Look for scam patterns like 'Amazon returns', '90% off', 'wire us', 'cash only', 'no refunds', or vague company info.
Return strict JSON:
{ "trust_score": number, "risk_level": "Low"|"Moderate"|"High", "summary": string, "positives": string[], "red_flags": string[] }`,
    },
    {
      role: "user",
      content: `Analyze the supplier using ONLY these facts:\n${facts}\n\nProvide a detailed but skeptical assessment.`,
    },
  ];
}

/* ------------------------------------------------------------------
   4️⃣ Main handler
-------------------------------------------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tool = body?.tool;
    const input = (body?.input ?? "").trim();

    if (!tool || tool !== "supplier-analyzer")
      return NextResponse.json({ error: "Invalid tool" }, { status: 400 });

    if (!/^https?:\/\/\S+/i.test(input))
      return NextResponse.json({ error: "Provide full URL with http(s)://" }, { status: 400 });

    const https = input.startsWith("https://");
    const domain = input.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

    const ssl = await safe("SSL", getSslStatus(domain));
    const homepage = await safe("HOMEPAGE", fetchHomepageIntel(input));

    const title =
      (homepage as any)?.title ??
      (homepage as any)?.meta?.title ??
      null;
    const metaDescription =
      (homepage as any)?.metaDescription ??
      (homepage as any)?.meta?.metaDesc ??
      null;
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

    if (DEBUG) console.log("FEATURES USED:", features, "preScore:", preScore);

    // ✅ Fix: Convert messages to mutable array
    const messages = buildSupplierAnalyzerPrompt({
      url: input,
      domain,
      https,
      features,
      score: preScore,
    }) as any[];

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
          "Combined factual and AI assessment of SSL, HTTPS, and transparency factors.",
        positives: aiOut.positives || [],
        red_flags: aiOut.red_flags || [],
        notes: ["v4 analyzer — calibrated scoring for scam detection"],
      },
    });
  } catch (err: any) {
    console.error("AI Tools API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}









