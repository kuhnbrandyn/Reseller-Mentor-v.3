import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function POST(req: Request) {
  try {
    const { message, context, email, thread_ts } = await req.json();
    const channel = process.env.SLACK_SUPPORT_CHANNEL!;
    const prefix = `💬 New Chat (${context})\n📧 ${email}\n`;

    // if thread_ts exists → reply in same thread
    const res = await slack.chat.postMessage({
      channel,
      text: thread_ts ? message : prefix + message,
      thread_ts: thread_ts || undefined,
    });

    return NextResponse.json({
      ok: true,
      thread_ts: res.ts,
    });
  } catch (err) {
    console.error("❌ Slack send failed:", err);
    return NextResponse.json({ ok: false, error: "Slack send failed" });
  }
}

