import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const channel = process.env.SLACK_SUPPORT_CHANNEL!;

export async function POST(req: Request) {
  try {
    const { message, context, email } = await req.json();

    if (!message)
      return NextResponse.json({ error: "Missing message" }, { status: 400 });

    // Build message text with context + optional email
    const text = `💬 *New Chat* (${context || "General"})\n${
      email ? `📧 ${email}\n` : ""
    }${message}`;

    // Post message to #support channel (Slack auto-creates a thread)
    const result = await slack.chat.postMessage({
      channel,
      text,
    });

    return NextResponse.json({
      ok: true,
      thread_ts: result.ts,
    });
  } catch (error: any) {
    console.error("Slack send error:", error);
    return NextResponse.json(
      { error: "Failed to send message to Slack" },
      { status: 500 }
    );
  }
}
