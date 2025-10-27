// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Fast, no extra setup

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildSupplierAnalyzerPrompt(url: string) {
  return [
    {
      role: "system",
      content:
        "You are an expert supplier trust evaluator for online resellers. Be concise, practical, and skeptical. Output ONLY JSON.",
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

Consider: SSL/HTTPS, domain age signals, contact info, return/refund policy,
pricing realism, stock photos vs original imagery, social proof, review quality,
brand name consistency, grammar/typos, and any obvious scam patterns.
If you cannot access external data, reason from the URL/name and provide general checks.
Output ONLY JSON. No prose outside JSON.
`,
    },
  ] as const;
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
      // Basic sanity check for URL-ish input (doesn't need to be perfect)
      if (!input || !/^https?:\/\/\S+/i.test(input)) {
        return NextResponse.json(
          { error: "Please provide a full URL starting with http(s)://" },
          { status: 400 }
        );
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: buildSupplierAnalyzerPrompt(input),
        temperature: 0.2,
      });

      const raw = completion.choices?.[0]?.message?.content || "{}";
      // Validate JSON
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Fallback structure if model deviates
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
