import { NextResponse } from "next/server";

export const runtime = "edge"; // fast response for Slack

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Slack URL verification (needed only on setup)
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // ✅ Handle messages sent in Slack
    if (body.event?.type === "message" && !body.event.bot_id) {
      const text = body.event.text;
      const user = body.event.user;
      const threadTs = body.event.thread_ts || body.event.ts;

      console.log("🔹 Reply received from Slack:", { text, user, threadTs });

      // Send the Slack reply to your client via Server-Sent Events (SSE)
      // We'll use the BroadcastChannel API for communication across users
      const bc = new BroadcastChannel("reseller_mentor_chat");
      bc.postMessage({ text, user, threadTs, from: "slack" });
      bc.close();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Slack reply handler error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

