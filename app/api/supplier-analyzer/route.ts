// app/api/supplier-analyzer/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSslStatus } from "../../../lib/domainIntel";
import { fetchHomepageIntel } from "../../../lib/fetchPageIntel";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const DEBUG = true;

/* ------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------*/
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
   🔎 Google Scam Mention Check (Free)
   Uses a public proxy to fetch Google search results for "<domain> scam"
-------------------------------------------------------------------*/
async function checkScamMentions(domain: string): Promise<"Low" | "Moderate" | "High" | "Unknown"> {
  try {
    const query = encodeURIComponent(`${domain} scam`);
    const res = await fetch(
      `https://api.allorigins.win/raw?url=https://www.google.com/search?q=${query}`
    );
    const html = await res.text();
    const matches = (html.match(/scam|fraud|complaint|ripoff|fake/gi) || []).length;
    if (matches > 5) return "High";
    if (matches > 2) return "Moderate";
    return "Low";
  } catch (err) {
    console.warn("Scam mention lookup failed:", err);
    return "Unknown";
  }
}

/* ------------------------------------------------------------------
   🧮 Trust Scoring (Deterministic)
   Adds domain age + scam weighting
-------------------------------------------------------------------*/
function computeTrustScore(f: {
  https: boolean;
  sslValid: boolean;
  sslExpiryDays: number | null;
  hasContact: boolean | null;
  trustSignals: number | null;
  negativeSignals: number;
  domainAgeMonths: number | null;
  scamLevel?: string;
}) {
  let score = 50;

  // HTTPS / SSL
  score += f.https ? 8 : -8;
  score += f.sslValid ? 8 : -10;

  // SSL expiry
  if (typeof f.sslExpiryDays === "number") {
    if (f.sslExpiryDays > 365) score += 3;
    else if (f.sslExpiryDays > 90) score += 1;
  }

  // Contact info
  if (f.hasContact === true) score += 6;
  else if (f.hasContact === false) score -= 4;

  // Trust signals
  if (typeof f.trustSignals === "number") {
    if (f.trustSignals >= 0.8) score += 12;
    else if (f.trustSignals >= 0.5) score += 8;
    else if (f.trustSignals < 0.2) score -= 6;
  }

  // 🕓 Domain age weighting (softer)
  if (f.domainAgeMonths) {
    if (f.domainAgeMonths > 24) score += 8;
    else if (f.domainAgeMonths > 6) score += 6;
    else score -= 6;
  }

  // ⚠️ Scam mention weighting (softer)
  if (f.scamLevel === "High") score -= 20;
  else if (f.scamLevel === "Moderate") score -= 6;

  // Generic negative signals
  score -= Math.min(f.negativeSignals, 5) * 8;

  return Math.max(5, Math.min(95, Math.round(score)));
}

/* ------------------------------------------------------------------
   🧠 Supplier Analyzer Prompt
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
      content: `
You are an expert supplier trust evaluator for liquidation and wholesale websites.
Be factual and balanced — many legitimate resellers have simple websites with minimal branding.
Be critical of scam traits: no contact info, fake testimonials, unrealistic profit promises, or cloned text.
Return JSON only in this format:
{
  "trust_score": number,
  "risk_level": "Low"|"Moderate"|"High",
  "summary": string,
  "positives": string[],
  "red_flags": string[]
}`,
    },
    {
      role: "user" as const,
      content: `Evaluate the supplier using this factual data:\n${facts}\n\nAssess credibility fairly — do not penalize simplicity if it looks like a genuine liquidation supplier.`,
    },
  ];
}

/* ------------------------------------------------------------------
   🚀 Main Handler
-------------------------------------------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = (body?.input ?? "").trim();

    if (!/^https?:\/\/\S+/i.test(input))
      return NextResponse.json(
        { error: "Provide full URL including http(s)://" },
        { status: 400 }
      );

    const https = input.startsWith("https://");
    const domain = input.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

    // === Step 1: Collect Data ===
    const ssl = await safe("SSL", getSslStatus(domain));
    const homepage = await safe("HOMEPAGE", fetchHomepageIntel(input));
    const scamLevel = await checkScamMentions(domain);

    const title = (homepage as any)?.title ?? null;
    const metaDescription = (homepage as any)?.metaDescription ?? null;
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

    // === Step 2: Compute Base Score (with new weighting) ===
    const preScore = computeTrustScore({
      https,
      sslValid: features.sslValid,
      sslExpiryDays: features.sslExpiryDays,
      hasContact: features.hasContact,
      trustSignals: features.trustSignals,
      negativeSignals: 0,
      domainAgeMonths: ssl?.domainAgeMonths ?? null,
      scamLevel,
    });

    // === Step 3: Ask OpenAI for Contextual Assessment ===
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
        summary: "Parsing fallback — AI output unreadable.",
        positives: [],
        red_flags: [],
      };
    }

    // === Step 4: Blend Deterministic + AI Scoring ===
    const finalScore = clamp(
      Math.round(preScore * 0.6 + (aiOut.trust_score || preScore) * 0.4),
      5,
      95
    );
    const finalLevel = toRiskLevel(finalScore);

    // === Step 5: Return Unified Output ===
    return NextResponse.json({
      ok: true,
      tool: "supplier-analyzer",
      data: {
        trust_score: finalScore,
        risk_level: finalLevel,
        scam_mentions: scamLevel,
        summary:
          aiOut.summary ||
          "Balanced assessment based on reseller-oriented credibility factors.",
        positives: aiOut.positives || [],
        red_flags: aiOut.red_flags || [],
        notes: [
          "v3 - Added Google scam mention detection + domain age weighting",
        ],
      },
    });
  } catch (err: any) {
    console.error("Supplier Analyzer API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

