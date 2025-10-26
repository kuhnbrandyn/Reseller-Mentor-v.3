import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const channel = process.env.SLACK_SUPPORT_CHANNEL!;

export async function POST(req: Request) {
  try {
    const { message, context, email, thread_ts } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // 🧠 If we already have a thread_ts, reply inside that thread
    if (thread_ts) {
      const reply = await slack.chat.postMessage({
        channel,
        text: message,
        thread_ts, // ✅ reply to existing thread
      });

      return NextResponse.json({ ok: true, thread_ts });
    }

    // 🆕 Otherwise, start a new conversation
    const text = `:speech_balloon: *New Chat* (${context || "Main Site"})\n${
      email ? `:e-mail: ${email}\n` : ""
    }${message}`;

    const result = await slack.chat.postMessage({
      channel,
      text,
    });

    return NextResponse.json({ ok: true, thread_ts: result.ts });
  } catch (error: any) {
    console.error("Slack send error:", error);
    return NextResponse.json(
      { error: "Failed to send message to Slack" },
      { status: 500 }
    );
  }
}

