// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const runtime = "nodejs";

/* -----------------------------
   1️⃣ Initialize Clients & Config
------------------------------ */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side role key only
);

// Approximate OpenAI rates for gpt-4.1-mini fine-tune
const INPUT_RATE = 0.00015; // per token USD
const OUTPUT_RATE = 0.0006; // per token USD
const ANNUAL_CAP = 100; // USD cap per user per year

/* -----------------------------
   2️⃣  API Handler
------------------------------ */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const input: string = (body?.input ?? "").trim();
    const userId = body?.user_id; // must be passed from frontend securely

    if (!input || !userId) {
      return NextResponse.json(
        { error: "Missing input or user ID" },
        { status: 400 }
      );
    }

 /* -----------------------------
   3️⃣  Check usage in Supabase (Fixed)
------------------------------ */
const { data: usageRow, error: usageError } = await supabase
  .from("ai_usage")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

if (usageError) {
  console.error("❌ Supabase read error:", usageError);
}

const currentSpent = Number(usageRow?.total_cost_usd ?? 0);
const usagePct = (currentSpent / ANNUAL_CAP) * 100;

console.log("💰 Current spent:", currentSpent, "Usage %:", usagePct);

// ✅ Cap enforcement
if (!isNaN(currentSpent) && currentSpent >= ANNUAL_CAP) {
  console.log("🚫 Cap hit — blocking user");
  return NextResponse.json(
    {
      error: "Usage limit reached",
      message:
        "⛔ You’ve hit your $100 annual AI limit. Please renew or upgrade.",
      usage: {
        usage_pct: 100,
        capped: true,
      },
    },
    { status: 403 }
  );
}


    /* -----------------------------
       4️⃣  Build AI Mentor Prompt
    ------------------------------ */
    const SYSTEM = `
You are AI Reseller Mentor — a business strategist and motivational coach for professional live resellers.
Your tone is confident, specific, and practical. You help users scale live-selling profits, find reliable suppliers, and master consistency.

Your response must always be JSON in this structure:
{
  "quick_win": "A clear and practical short-term step (1-2 sentences)",
  "data_driven": "A metric, best practice, or insight supported by data or examples (2-4 sentences)",
  "long_term_plan": "A more detailed 3-6 sentence explanation of sustainable strategy and execution steps",
  "motivation_end": "A closing motivational statement that reinforces action and confidence (1-2 sentences)",
  "list": [
    { "name": "", "category": "", "why_good": "", "notes": "" }
  ]
}

Rules:
- Expand details naturally. Each section should feel like a full paragraph when context allows.
- When the user mentions *suppliers*, *wholesalers*, or *liquidation*, fill the 'list' array with at least 3 reputable U.S. sources (Via Trading, BULQ, 888 Lots, B-Stock, BlueLots, Wholesale Fashion Square, etc.) and explain why each is valuable.
- For all other topics, leave 'list' as an empty array [].
- Avoid repeating phrases or oversimplifying advice.
- Maintain warmth, confidence, and depth — write as if mentoring a 6-figure seller aiming to scale higher.
`;


    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM },
      { role: "user", content: input },
    ];

    /* -----------------------------
       5️⃣  Run OpenAI Completion
    ------------------------------ */
    const completion = await openai.chat.completions.create({
      model:
        process.env.OPENAI_FINE_TUNE_MENTOR_MODEL ||
        "ft:gpt-4.1-mini-2025-04-14:reseller-mentor:resellermentorv2:CSwYEtfH",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages,
      max_tokens: 1000,
    });

    const raw =
      completion.choices?.[0]?.message?.content ??
      '{"quick_win":"N/A","data_driven":"N/A","long_term_plan":"N/A","motivation_end":"Stay consistent."}';

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        quick_win: "N/A",
        data_driven: "N/A",
        long_term_plan: "N/A",
        motivation_end:
          "Keep pushing forward — small steps daily lead to big results.",
      };
    }

    /* -----------------------------
       6️⃣  Calculate Token Cost & Update Supabase
    ------------------------------ */
    const tokensIn = completion.usage?.prompt_tokens || 0;
    const tokensOut = completion.usage?.completion_tokens || 0;
    const totalCost = tokensIn * INPUT_RATE + tokensOut * OUTPUT_RATE;

   await supabase.from("ai_usage").upsert({
  user_id: userId,
  total_tokens: (usageRow?.total_tokens || 0) + tokensIn + tokensOut,
  total_cost_usd: currentSpent + totalCost,
  last_reset: usageRow?.last_reset || new Date(),
});


    const newSpent = currentSpent + totalCost;
    const newPct = Math.min((newSpent / ANNUAL_CAP) * 100, 100);

    /* -----------------------------
       7️⃣  Return Mentor Output + Usage Stats
    ------------------------------ */
    return NextResponse.json({
      ok: true,
      tool: "ai-mentor",
      result: parsed,
      usage: {
        spent_usd: newSpent.toFixed(2),
        usage_pct: newPct.toFixed(1),
        capped: newPct >= 100,
        near_cap: newPct >= 90 && newPct < 100,
      },
    });
  } catch (err) {
    console.error("AI Mentor API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
















