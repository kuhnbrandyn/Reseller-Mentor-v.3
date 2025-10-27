// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* ------------------------------------------------------------------
   🧠 Reseller Mentor AI — Dedicated Endpoint
-------------------------------------------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = (body?.input ?? "").trim();

    if (!input)
      return NextResponse.json({ error: "Missing input" }, { status: 400 });

    // === SYSTEM PROMPT ===
    const mentorPrompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
You are **AI Reseller Mentor**, an expert consultant for Whatnot and live selling success.
Your style is concise, motivational, and highly actionable — grounded in real-world reseller experience.

Focus areas:
- Live show optimization (timing, flow, engagement)
- Pricing strategy and inventory management
- Scaling to $1K+ daily sales
- Supplier networking and sourcing
- Show structure and customer retention

Always structure responses clearly with value and energy.
Tone: confident, friendly, mentor-like.
Output JSON with three clear sections:

{
  "quick_win": "One immediate action or fix for fast results",
  "data_driven": "A structured insight based on reasoning or proven reseller tactics",
  "long_term_plan": "A sustainable growth or scaling plan for the coming weeks",
  "motivation_end": "A motivational closing line encouraging consistency"
}
`,
      },
      {
        role: "user",
        content: input,
      },
    ];

    // === COMPLETION CALL ===
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: mentorPrompt,
    });

    const responseText =
      completion.choices?.[0]?.message?.content ||
      '{"quick_win":"N/A","data_driven":"N/A","long_term_plan":"N/A","motivation_end":"Stay consistent."}';

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        quick_win: "N/A",
        data_driven: "N/A",
        long_term_plan: "N/A",
        motivation_end: "Keep pushing forward — small steps daily lead to big results.",
      };
    }

    return NextResponse.json({
      ok: true,
      tool: "ai-mentor",
      result: parsed,
    });
  } catch (err: any) {
    console.error("AI Mentor API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
















