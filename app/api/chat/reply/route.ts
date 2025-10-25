import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");
    const secret = process.env.SLACK_SIGNING_SECRET!;

    // Verify Slack signature
    const baseString = `v0:${timestamp}:${rawBody}`;
    const mySig =
      "v0=" +
      crypto.createHmac("sha256", secret).update(baseString).digest("hex");

    if (mySig !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);

    // Slack URL verification
    if (payload.type === "url_verification") {
      return new Response(payload.challenge);
    }

    // Handle message events
    if (
      payload.event &&
      payload.event.type === "message" &&
      payload.event.subtype !== "bot_message"
    ) {
      console.log("Slack reply:", payload.event.text);
      // Here you can forward to Supabase, Pusher, etc. if you want to show live on site
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack reply error:", error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
