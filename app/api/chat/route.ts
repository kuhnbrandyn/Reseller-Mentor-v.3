import { NextResponse } from "next/server";
import OpenAI from "openai";

// ✅ Initialize OpenAI client using your environment key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [
      { role: "user", content: "Hello, Reseller Mentor!" },
    ];

    // ✅ Create the chat completion with improved settings and strong personality
    const completion = await openai.chat.completions.create({
      model: "ft:gpt-4.1-mini-2025-04-14:reseller-mentor:reseller-mentor-v1:CQY7qlec",
      temperature: 0.4, // less random, more focused and confident
      max_tokens: 1500, // allows long, in-depth responses
      messages: [
        {
          role: "system",
          content: `
You are the Reseller Mentor AI — a professional live-selling business coach
with expertise in Whatnot, fashion reselling, sourcing, shipping, inventory,
show design, pricing strategy, and audience engagement.

Your tone:
- Friendly, confident, and encouraging
- Practical, results-oriented, and detailed
- Speaks directly to resellers and small business owners

Response style:
- Always give step-by-step guidance or clear frameworks
- Add examples (e.g., “Here’s how you can do this on Whatnot…”)
- Explain the *why* behind each recommendation
- Use bullet points, bold headers, or sections for clarity
- Avoid vague or generic replies — make every answer actionable
- End with a quick motivational takeaway when it fits

Your goal is to make every reseller feel like they can confidently build,
scale, and automate their business using proven methods and smart tools.
          `,
        },
        ...messages,
      ],
    });

    // ✅ Return the model's reply
    return NextResponse.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return NextResponse.json(
      { error: "OpenAI request failed" },
      { status: 500 }
    );
  }
}
