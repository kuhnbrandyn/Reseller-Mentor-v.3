// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getWhoisAge, getSslStatus } from "../../../lib/domainIntel";
import { fetchHomepageIntel } from "../../../lib/fetchPageIntel";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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
   2️⃣  Deterministic trust-score computation
-------------------------------------------------------------------*/
function computeTrustScore(f: {
  https: boolean;
  sslValid: boolean;
  sslExpiryDays: number | null;
  domainAgeYears: number | null;
  hasContact: boolean | null;
  trustSignals: number | null;
  negativeSignals: number;
}) {
  let score = 50;
  score += f.https ? 12 : -6;
  score += f.sslValid ? 12 : -12;
  if (typeof f.sslExpiryDays === "number") {
    if (f.sslExpiryDays > 365) score += 4;
    else if (f.sslExpiryDays > 90) score += 2;
  }
  if (typeof f.domainAgeYears === "number") {
    score += Math.min(f.domainAgeYears, 10) * 2;
  } else {
    score -= 6;
  }
  score += f.hasContact ? 6 : -4;
  if (typeof f.trustSignals === "number") score += Math.round(f.trustSignals * 20);
  score += -Math.min(f.negativeSignals, 3) * 10;
  return Math.max(5, Math.min(95, Math.round(score)));
}

/* ------------------------------------------------------------------
   3️⃣ Prompt builder — returns proper typed array
-------------------------------------------------------------------*/
function buildSupplierAnalyzerPrompt(args: {
  url: string;
  domain: string;
  https: boolean;
  features: {
    sslValid: boolean;
    sslExpiryDays: number | null;
    domainAgeYears: number | null;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    hasContact: boolean | null;
    trustSignals: number | null;
  };
  score: number;
}): ChatCompletionMessageParam[] {
  const f = args.features;
  const facts = [
    `URL: ${args.url}`,
    `Domain: ${args.domain}`,
    `HTTPS: ${args.https}`,
    `SSL valid: ${f.sslValid}`,
    `SSL expiry days: ${f.sslExpiryDays ?? "unknown"}`,
    `Domain age (years): ${f.domainAgeYears ?? "unknown"}`,
    `Title: ${f.title ?? "n/a"}`,
    `Meta: ${f.metaDescription ?? "n/a"}`,
    `H1: ${f.h1 ?? "n/a"}`,
    `Has contact info: ${f.hasContact ?? "unknown"}`,
    `Trust signals (0..1): ${f.trustSignals ?? 0}`,
    `Deterministic score: ${args.score}`,
  ].join("\n");

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are an expert supplier trust evaluator for online resellers. Be concise and factual. Only return strict JSON with keys: { trust_score, risk_level, summary, positives, red_flags }.",
    },
    {
      role: "user",
      content: `Analyze the supplier using ONLY these facts:\n${facts}\n\nProvide a reasoned trust assessment.`,
    },
  ];
  return messages;
}

/* ------------------------------------------------------------------
   4️⃣ Main Handler
-------------------------------------------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tool = body?.tool;
    const input = (body?.input ?? "").trim();

    if (tool !== "supplier-analyzer")
      return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
    if (!/^https?:\/\/\S+/i.test(input))
      return NextResponse.json({ error: "Provide full URL starting with http(s)://" }, { status: 400 });

    const https = input.startsWith("https://");
    const domain = input.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

    const whois = await safe("WHOIS", getWhoisAge(domain));
    const ssl = await safe("SSL", getSslStatus(domain));
    const homepage = await safe("HOMEPAGE", fetchHomepageIntel(input));

    const features = {
      sslValid: !!ssl?.sslValid,
      sslExpiryDays: ssl?.sslDaysRemaining ?? null,
      domainAgeYears: whois?.ageYears ?? null,
      title: (homepage as any)?.title ?? (homepage as any)?.meta?.title ?? null,
      metaDescription:
        (homepage as any)?.metaDescription ?? (homepage as any)?.meta?.metaDesc ?? null,
      h1: (homepage as any)?.h1 ?? null,
      hasContact: (homepage as any)?.hasContact ?? null,
      trustSignals: (homepage as any)?.trustSignals ?? 0,
    };

    const preScore = computeTrustScore({
      https,
      sslValid: features.sslValid,
      sslExpiryDays: features.sslExpiryDays,
      domainAgeYears: features.domainAgeYears,
      hasContact: features.hasContact,
      trustSignals: features.trustSignals,
      negativeSignals: 0,
    });

    if (DEBUG) console.log("FEATURES USED:", features, "preScore:", preScore);

    const messages = buildSupplierAnalyzerPrompt({
      url: input,
      domain,
      https,
      features,
      score: preScore,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
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
          "Combined factual and AI assessment of domain, SSL, and site transparency.",
        positives: aiOut.positives || [],
        red_flags: aiOut.red_flags || [],
        notes: ["v2 analyzer using structured facts"],
      },
    });
  } catch (err: any) {
    console.error("AI Tools API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}







