import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");
    const secret = process.env.SLACK_SIGNING_SECRET!;

    // Parse JSON safely
    const payload = JSON.parse(rawBody);

    // ✅ Step 1: Handle Slack URL verification challenge
    if (payload.type === "url_verification" && payload.challenge) {
      return new Response(payload.challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // ✅ Step 2: Verify Slack signature for normal events
    if (!timestamp || !signature)
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    const baseString = `v0:${timestamp}:${rawBody}`;
    const mySig =
      "v0=" +
      crypto.createHmac("sha256", secret).update(baseString).digest("hex");

    if (mySig !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ✅ Step 3: Handle real message events
    if (
      payload.event &&
      payload.event.type === "message" &&
      payload.event.subtype !== "bot_message"
    ) {
      console.log("📨 Slack reply received:", payload.event.text);
      // Future: forward this message to Supabase/Pusher/WebSocket
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Slack reply error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

