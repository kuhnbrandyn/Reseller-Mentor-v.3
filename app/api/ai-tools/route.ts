// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Fast, no extra setup

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Updated system prompt with context awareness
function buildSupplierAnalyzerPrompt(url: string): Array<{
  role: "system" | "user";
  content: string;
}> {
  return [
    {
      role: "system",
      content: `
You are an expert supplier trust evaluator for online resellers.
Be concise, practical, and balanced — give legitimate marketplaces
the benefit of the doubt unless clear red flags exist.

Known legitimate liquidation and wholesale suppliers include:
Macy's Liquidation, BStock, Bulq, Boutique by the Box, 888Lots,
Via Trading, Quicklotz, Direct Liquidation, ShopBinStores, and Liquidation.com.

Use these as positive reference examples when evaluating new suppliers.
Return ONLY JSON. No prose outside the JSON.
      `,
    },
    {
      role: "user",
      content: `
Analyze this supplier URL for legitimacy: ${url}

Return strict JSON with this exact shape:
{
  "trust_score": <number 0-100>,
  "risk_level": "Low" | "Moderate" | "High",
  "summary": "<3-5 sentence summary>",
  "positives": ["...","..."],
  "red_flags": ["...","..."],
  "notes": ["optional extra tips if any"]
}

Consider: SSL/HTTPS, domain name credibility, contact info,
pricing realism, original vs stock photos, reviews, grammar,
and any scam indicators. If you cannot access external data,
reason based on the domain name, context, and patterns.
Output ONLY JSON.
`,
    },
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tool = body?.tool;
    const input = (body?.input ?? "").trim();

    if (!tool) {
      return NextResponse.json({ error: "Missing 'tool'." }, { status: 400 });
    }

    if (tool === "supplier-analyzer") {
      // Basic sanity check for URL-ish input
      if (!input || !/^https?:\/\/\S+/i.test(input)) {
        return NextResponse.json(
          { error: "Please provide a full URL starting with http(s)://" },
          { status: 400 }
        );
      }

      // 🧩 Step 1: Deterministic pre-checks (from your Supplier Vault)
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
        "app.ghost.io", // included from your screenshot
      ];

      const flaggedTerms = [
        "replica",
        "fake",
        "cheapbrand",
        "superdiscount",
        "outletwholesale",
        "designerreplica",
      ];

      const domain = input.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

      // 🟢 Trusted supplier bypass
      if (trustedSuppliers.some((site) => domain.includes(site))) {
        return NextResponse.json({
          ok: true,
          tool,
          data: {
            trust_score: 95,
            risk_level: "Low",
            summary: `✅ ${domain} is a verified supplier listed in Reseller Mentor's trusted Supplier Vault.`,
            positives: [
              "Trusted liquidation/wholesale source",
              "Listed in verified Supplier Vault",
            ],
            red_flags: [],
            notes: ["Bypassed AI due to trusted supplier match."],
          },
        });
      }

      // 🔴 Flagged term bypass
      if (flaggedTerms.some((term) => domain.includes(term))) {
        return NextResponse.json({
          ok: true,
          tool,
          data: {
            trust_score: 20,
            risk_level: "High",
            summary: `⚠️ ${domain} contains suspicious wording associated with high-risk or counterfeit suppliers.`,
            positives: [],
            red_flags: ["Contains risky keywords in domain name"],
            notes: ["Bypassed AI due to risk pattern match."],
          },
        });
      }

      // ✅ Step 2: GPT reasoning layer
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: buildSupplierAnalyzerPrompt(input),
        temperature: 0.2,
      });

      const raw = completion.choices?.[0]?.message?.content || "{}";

      // ✅ Step 3: JSON validation and normalization
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {
          trust_score: 50,
          risk_level: "Moderate",
          summary:
            "The AI response was not valid JSON. Returning a safe fallback. Try again.",
          positives: [],
          red_flags: [],
          notes: [],
          _raw: raw,
        };
      }

      // ✅ Step 4: Score normalization for liquidation-related domains
      if (parsed.trust_score < 50 && domain.includes("liquidation")) {
        parsed.trust_score = Math.max(parsed.trust_score, 70);
        parsed.risk_level = "Moderate";
        parsed.notes = [
          ...(parsed.notes || []),
          "Domain includes 'liquidation' which can be legitimate for verified sources.",
        ];
      }

      return NextResponse.json({ ok: true, tool, data: parsed });
    }

    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  } catch (err: any) {
    console.error("AI Tools API error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
