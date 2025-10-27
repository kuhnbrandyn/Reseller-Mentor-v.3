// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* ------------------------------------------------------------------
   🧠 Reseller Mentor AI (Fine-Tuned Model)
-------------------------------------------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = (body?.input ?? "").trim();

    if (!input)
      return NextResponse.json({ error: "Missing input" }, { status: 400 });

    const mentorPrompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
You are AI Reseller Mentor — a motivational, data-driven expert who helps live sellers scale to $1000+ sales days, source profitable inventory, and master Whatnot growth.
Be concise, practical, and grounded in reseller experience. Use warm, confident tone.
Return JSON with these four sections:
{
  "quick_win": "One immediate, easy-to-implement action",
  "data_driven": "Insight backed by logic, numbers, or real-world trend",
  "long_term_plan": "A sustainable growth or scaling plan for the coming weeks",
  "motivation_end": "A short motivational closing message"
}`,
      },
      {
        role: "user",
        content: input,
      },
    ];

    // ✅ Use fine-tuned model (with fallback)
    const completion = await openai.chat.completions.create({
      model:
        process.env.OPENAI_FINE_TUNE_MENTOR_MODEL ||
        "ft:gpt-4.1-mini-2025-04-14:reseller-mentor:resellermentorv2:CSwYEtfH",
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
        motivation_end:
          "Keep pushing forward — small steps daily lead to big results.",
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














