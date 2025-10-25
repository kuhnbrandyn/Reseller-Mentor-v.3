import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // ✅ Read and parse body
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // ✅ Handle Slack URL verification
    if (payload.type === "url_verification" && payload.challenge) {
      return new Response(payload.challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // ✅ Verify request signature (for normal Slack messages)
    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");
    const secret = process.env.SLACK_SIGNING_SECRET!;

    if (!timestamp || !signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const baseString = `v0:${timestamp}:${rawBody}`;
    const mySig =
      "v0=" +
      crypto.createHmac("sha256", secret).update(baseString).digest("hex");

    if (mySig !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ✅ Handle real message events
    if (
      payload.event &&
      payload.event.type === "message" &&
      payload.event.subtype !== "bot_message"
    ) {
      console.log("📨 Slack message received:", payload.event.text);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Slack verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

