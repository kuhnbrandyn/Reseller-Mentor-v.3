// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getWhoisAge, getSslStatus } from "../../../lib/domainIntel";
import { fetchHomepageIntel } from "../../../lib/fetchPageIntel";

export const runtime = "nodejs"; // use Node runtime (Edge doesn't support tls)

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
- WHOIS domain age
- SSL validity
- Homepage text patterns (pricing realism, hype language)
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
      "app.ghost.io",
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

    // ✅ Fixed Trusted Supplier Match (exact or subdomain only)
    const isTrusted = trustedSuppliers.some((d) =>
      domain === d || domain.endsWith(`.${d}`)
    );

    if (isTrusted) {
      return NextResponse.json({
        ok: true,
        tool,
        data: {
          trust_score: 95,
          risk_level: "Low",
          summary: `✅ ${domain} is a verified supplier from the Reseller Mentor trusted list.`,
          positives: [
            "Verified source",
            "Commonly used by professional resellers",
            "Recognized marketplace/program",
          ],
          red_flags: [],
          notes: ["Whitelisted (trusted) — AI bypassed to keep results consistent."],
        },
      });
    }

    // ---------------------------
    // Baseline scoring
    // ---------------------------
    let baseScore = 60;

    if (!https) {
      baseScore -= 10;
      preFlags.push("Site is not using HTTPS.");
    } else {
      prePositives.push("HTTPS enabled.");
    }

    const hasLiquidationWord = /liquidation/i.test(domain);
    if (hasLiquidationWord) {
      baseScore -= 10;
      preFlags.push("Domain includes 'liquidation' (neutral term often abused; verify legitimacy).");
    }

    for (const kw of riskyKeywords) {
      if (domain.includes(kw)) {
        baseScore -= 30;
        preFlags.push(`Domain includes risky keyword: '${kw}'.`);
      }
    }

    const matchedRiskyTLD = riskyTLDs.find((t) => domain.endsWith(t));
    if (matchedRiskyTLD) {
      baseScore -= 15;
      preFlags.push(`Domain uses lower-reputation TLD '${matchedRiskyTLD}'.`);
    }

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

    const hostRoot = domain.split(".")[0];
    if (hostRoot.length <= 3) {
      baseScore -= 5;
      preFlags.push("Hostname is unusually short (credibility concern).");
    }

    baseScore = clamp(baseScore, 5, 85);

    // ---------------------------
    // WHOIS + SSL intel
    // ---------------------------
    let intelSummary = "";
    try {
      const [whois, ssl] = await Promise.all([
        getWhoisAge(domain),
        getSslStatus(domain),
      ]);

      intelSummary = `
WHOIS Age: ${whois.ageYears ? `${whois.ageYears} years` : "unknown"}
Created: ${whois.createdAt || "unknown"}
SSL Valid: ${ssl.sslValid ? "Yes" : "No"}
SSL Issuer: ${ssl.sslIssuer || "unknown"}
Days Until Expiry: ${ssl.sslDaysRemaining ?? "unknown"}
`.trim();

      if (whois.ageYears && whois.ageYears > 5) {
        baseScore += 5;
        prePositives.push("Domain has existed for over 5 years.");
      } else if (whois.ageYears && whois.ageYears < 1) {
        baseScore -= 10;
        preFlags.push("Newly created domain (<1 year old).");
      }

      if (ssl.sslValid) {
        prePositives.push("SSL certificate is valid and active.");
      } else {
        baseScore -= 5;
        preFlags.push("SSL certificate appears invalid or expired.");
      }
    } catch (err) {
      console.warn("Domain intel lookup failed:", err);
    }

    baseScore = clamp(baseScore, 5, 95);

    // ---------------------------
    // Homepage text + price patterns
    // ---------------------------
    let homepageIntel: any = {};
    try {
      homepageIntel = await fetchHomepageIntel(input);
      if (homepageIntel.error) {
        preFlags.push(`Homepage fetch failed: ${homepageIntel.error}`);
      } else {
        const { phrases, meta } = homepageIntel;
        if (phrases.length > 0) {
          preFlags.push(`Suspicious marketing language found: ${phrases.join(", ")}`);
          baseScore -= Math.min(phrases.length * 5, 20);
        }
        if (meta.title && meta.title.length > 0) {
          prePositives.push(`Title detected: ${meta.title}`);
        }
        if (meta.metaDesc && /official|trusted|verified/i.test(meta.metaDesc)) {
          baseScore += 3;
          prePositives.push("Meta description includes credibility terms.");
        }
      }
    } catch (err) {
      preFlags.push("Homepage scan failed unexpectedly.");
    }

    baseScore = clamp(baseScore, 5, 95);

    if (baseScore <= 35) {
      return NextResponse.json({
        ok: true,
        tool,
        data: {
          trust_score: baseScore,
          risk_level: toRiskLevel(baseScore),
          summary:
            "⚠️ Deterministic and factual checks indicate elevated risk based on domain, WHOIS/SSL, and homepage text.",
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
        prePositives: [
          ...prePositives,
          intelSummary,
          homepageIntel?.meta?.title || "",
        ],
        preFlags: [
          ...preFlags,
          ...(homepageIntel?.phrases || []),
        ],
        preScore: baseScore,
      }),
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";

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

    const aiScore = clamp(Number(ai.trust_score ?? 55), 10, 95);
    let finalScore = Math.round(baseScore * 0.6 + aiScore * 0.4);
    if (/liquidation/i.test(domain)) finalScore = Math.min(finalScore, 70);

    finalScore = clamp(finalScore, 5, 95);
    const finalLevel = toRiskLevel(finalScore);

    const positives = Array.from(new Set([...(ai.positives ?? []), ...prePositives]));
    const redFlags = Array.from(new Set([...(ai.red_flags ?? []), ...preFlags]));
    const notes = [...(ai.notes ?? [])];

    const summary =
      ai.summary ||
      "Supplier analyzed using deterministic, factual (WHOIS/SSL + homepage), and AI reasoning. Consider a small test order and verify details before scaling.";

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





