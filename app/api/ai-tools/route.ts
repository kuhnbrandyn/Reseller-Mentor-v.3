// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** ---------------------------
 * Prompt (context-aware, conservative)
 * --------------------------- */
function buildSupplierAnalyzerPrompt(args: {
  url: string;
  domain: string;
  https: boolean;
  prePositives: string[];
  preFlags: string[];
  preScore: number; // deterministic base score (0-100)
}): Array<{ role: "system" | "user"; content: string }> {
  const { url, domain, https, prePositives, preFlags, preScore } = args;

  return [
    {
      role: "system",
      content: `
You are an expert supplier trust evaluator for online resellers.
Be concise, practical, and conservative. ONLY return JSON.

Important rules:
- Do NOT assume a site is safe because it contains the word "liquidation".
- Treat "liquidation" neutrally unless it matches a known trusted program.
- Known trusted examples: BStock, Bulq, 888Lots, Via Trading, Liquidation.com, Quicklotz, Direct Liquidation, ShopBinStores.
- If information is insufficient, lean toward "Moderate" risk with clear next steps.

Output JSON with:
{
  "trust_score": <0-100>,
  "risk_level": "Low" | "Moderate" | "High",
  "summary": "<3-5 sentences>",
  "positives": ["..."],
  "red_flags": ["..."],
  "notes": ["..."]
}
      `.trim(),
    },
    {
      role: "user",
      content: `
Analyze this supplier:

URL: ${url}
Domain: ${domain}
HTTPS: ${https ? "Yes" : "No"}

Deterministic pre-analysis:
Base score (0-100): ${preScore}
Positives (pre): ${JSON.stringify(prePositives)}
Red flags (pre): ${JSON.stringify(preFlags)}

Consider:
- Domain credibility and naming (typos, hyphens, digits spam)
- HTTPS presence
- Pricing realism / language patterns (if inferable from the name)
- Review authenticity indicators (only if inferable)
- Overall brand legitimacy patterns

Return ONLY the JSON specified above.
      `.trim(),
    },
  ];
}

/** ---------------------------
 * Helpers
 * --------------------------- */
function toRiskLevel(score: number): "Low" | "Moderate" | "High" {
  if (score >= 80) return "Low";
  if (score >= 50) return "Moderate";
  return "High";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** ---------------------------
 * Handler
 * --------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tool = body?.tool;
    const input = (body?.input ?? "").trim();

    if (!tool) {
      return NextResponse.json({ error: "Missing 'tool'." }, { status: 400 });
    }

    if (tool !== "supplier-analyzer") {
      return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
    }

    // Basic sanity check for URL-ish input
    if (!input || !/^https?:\/\/\S+/i.test(input)) {
      return NextResponse.json(
        { error: "Please provide a full URL starting with http(s)://" },
        { status: 400 }
      );
    }

    // ---------------------------
    // Deterministic pre-checks
    // ---------------------------
    const https = input.toLowerCase().startsWith("https://");
    const domain = input.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();

    // Your trusted list (from Supplier Vault/screenshot + common legit sources)
    const trustedSuppliers = [
      "888lots.com",
      "bstock.com",
      "bulq.com",
      "liquidation.com",
      "directliquidation.com",
      "quicklotz.com",
      "shopbinstores.com",
      "viatrading.com",
      "nusource.io",
      "macysliquidation.com",
      "app.ghost.io", // was on your list; keep if truly intended
    ];

    const riskyKeywords = [
      "replica",
      "fake",
      "counterfeit",
      "cheapbrand",
      "superdiscount",
      "designerreplica",
      "authentic-guarantee",
      "luxuryoutlet",
    ];

    const riskyTLDs = [
      ".xyz",
      ".top",
      ".shop",
      ".store",
      ".buzz",
      ".online",
      ".icu",
      ".best",
      ".info",
      ".biz",
    ];

    const preFlags: string[] = [];
    const prePositives: string[] = [];

    // Trusted bypass
    const isTrusted = trustedSuppliers.some((d) => domain.endsWith(d) || domain.includes(d));
    if (isTrusted) {
      return NextResponse.json({
        ok: true,
        tool,
        data: {
          trust_score: 95,
          risk_level: "Low",
          summary: `✅ ${domain} is a verified supplier from the Reseller Mentor trusted list.`,
          positives: ["Verified source", "Commonly used by professional resellers", "Recognized marketplace/program"],
          red_flags: [],
          notes: ["Whitelisted (trusted) — AI bypassed to keep results consistent."],
        },
      });
    }

    // Baseline score (neutral = 60). We'll add +/- penalties/credits.
    let baseScore = 60;

    // HTTPS check
    if (!https) {
      baseScore -= 10;
      preFlags.push("Site is not using HTTPS.");
    } else {
      prePositives.push("HTTPS enabled.");
    }

    // "liquidation" heuristic — neutral, but risky unless trusted
    const hasLiquidationWord = /liquidation/i.test(domain);
    if (hasLiquidationWord) {
      baseScore -= 10; // don't boost; slightly penalize unless trusted
      preFlags.push("Domain includes 'liquidation' (neutral term often abused; verify legitimacy).");
    }

    // risky keywords in domain
    for (const kw of riskyKeywords) {
      if (domain.includes(kw)) {
        baseScore -= 30;
        preFlags.push(`Domain includes risky keyword: '${kw}'.`);
      }
    }

    // risky TLDs
    const matchedRiskyTLD = riskyTLDs.find((t) => domain.endsWith(t));
    if (matchedRiskyTLD) {
      baseScore -= 15;
      preFlags.push(`Domain uses lower-reputation TLD '${matchedRiskyTLD}'.`);
    }

    // too many digits or hyphens
    const digits = (domain.match(/\d/g) || []).length;
    const hyphens = (domain.match(/-/g) || []).length;
    if (digits >= 3) {
      baseScore -= 8;
      preFlags.push("Domain contains many digits.");
    }
    if (hyphens >= 2) {
      baseScore -= 8;
      preFlags.push("Domain contains many hyphens.");
    }

    // very short/odd hostname
    const hostRoot = domain.split(".")[0];
    if (hostRoot.length <= 3) {
      baseScore -= 5;
      preFlags.push("Hostname is unusually short (credibility concern).");
    }

    // Clamp deterministic base to sane range
    baseScore = clamp(baseScore, 5, 85);

    // If clearly bad from deterministic checks, short-circuit to High risk
    if (baseScore <= 35) {
      return NextResponse.json({
        ok: true,
        tool,
        data: {
          trust_score: baseScore,
          risk_level: toRiskLevel(baseScore),
          summary:
            "⚠️ Deterministic checks indicate elevated risk based on domain characteristics. Proceed with caution and verify with a small test order.",
          positives: prePositives,
          red_flags: preFlags,
          notes: ["High-risk domain patterns triggered; GPT not invoked for cost and consistency."],
        },
      });
    }

    // ---------------------------
    // GPT reasoning (weighted blend)
    // ---------------------------
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: buildSupplierAnalyzerPrompt({
        url: input,
        domain,
        https,
        prePositives,
        preFlags,
        preScore: baseScore,
      }),
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";

    // Parse JSON safely
    let ai: {
      trust_score?: number;
      risk_level?: "Low" | "Moderate" | "High" | string;
      summary?: string;
      positives?: string[];
      red_flags?: string[];
      notes?: string[];
    } = {};

    try {
      ai = JSON.parse(raw);
    } catch {
      ai = {
        trust_score: 55,
        risk_level: "Moderate",
        summary:
          "AI response was not valid JSON; returning a conservative fallback. Try again or validate manually.",
        positives: [],
        red_flags: [],
        notes: [],
      };
    }

    // Normalize AI score
    const aiScore = clamp(Number(ai.trust_score ?? 55), 10, 95);

    // Blend scores: lean on deterministic rules more than AI
    let finalScore = Math.round(baseScore * 0.6 + aiScore * 0.4);

    // IMPORTANT: cap non-whitelisted "liquidation" domains
    if (hasLiquidationWord) {
      finalScore = Math.min(finalScore, 70);
    }

    finalScore = clamp(finalScore, 5, 95);
    const finalLevel = toRiskLevel(finalScore);

    // Merge reason lists
    const positives = Array.from(new Set([...(ai.positives ?? []), ...prePositives]));
    const redFlags = Array.from(new Set([...(ai.red_flags ?? []), ...preFlags]));
    const notes = [...(ai.notes ?? [])];

    // Ensure summary exists
    const summary =
      ai.summary ||
      "Supplier analyzed using deterministic domain checks and AI reasoning. Consider a small test order and verify business details before scaling.";

    return NextResponse.json({
      ok: true,
      tool,
      data: {
        trust_score: finalScore,
        risk_level: finalLevel,
        summary,
        positives,
        red_flags: redFlags,
        notes,
      },
    });
  } catch (err: any) {
    console.error("AI Tools API error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}

