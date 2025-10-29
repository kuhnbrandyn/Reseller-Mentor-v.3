// app/api/ai-tools/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const input: string = (body?.input ?? "").trim();
    const clientMessages = Array.isArray(body?.messages) ? body.messages : null;

    if (!input && !clientMessages) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const SYSTEM = `
You are AI Reseller Mentor — a detailed, data-backed business strategist for live resellers.
Provide concise but **insightful** answers that feel like a seasoned mentor explaining what works and why.
When the user asks for suppliers, return real, reputable names relevant to US fashion liquidation/wholesale, with specific reasoning and real examples where possible.

Rules:
- Output JSON only.
- Required keys: quick_win, data_driven, long_term_plan, motivation_end.
- Optional key: list (array of { name, category, why_good, notes }).
- Each field (quick_win, data_driven, long_term_plan, motivation_end) should include **2–3 sentences** that combine practical insight + action.
- Do NOT invent emails/phones/addresses. If unknown, use "unknown".
- If unsure, prefer mainstream sources (B-Stock, Via Trading, 888 Lots, BULQ, BlueLots, TopTenWholesale) and include verification steps.
- Maintain a confident, actionable, mentor tone focused on scaling, sourcing, and operational excellence.
`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> =
      clientMessages ?? [
        { role: "system", content: SYSTEM },
        { role: "user", content: input },
      ];

    // If client sent messages without a system message, add ours
    if (clientMessages && !clientMessages.some((m: any) => m.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM });
    }

    const completion = await openai.chat.completions.create({
      model:
        process.env.OPENAI_FINE_TUNE_MENTOR_MODEL ||
        "ft:gpt-4.1-mini-2025-04-14:reseller-mentor:resellermentorv2:CSwYEtfH",
      temperature: 0.55, // slightly higher for richer depth
      response_format: { type: "json_object" },
      messages,
      max_tokens: 1000, // small bump for slightly longer outputs
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

    return NextResponse.json({ ok: true, tool: "ai-mentor", result: parsed });
  } catch (err) {
    console.error("AI Mentor API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
















