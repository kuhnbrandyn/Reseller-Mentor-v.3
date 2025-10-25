import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");
  const secret = process.env.SLACK_SIGNING_SECRET!;

  // verify signature
  const base = `v0:${timestamp}:${rawBody}`;
  const hash =
    "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.type === "url_verification") {
    return new Response(payload.challenge, { status: 200 });
  }

  const event = payload.event;
  if (event && event.type === "message" && event.thread_ts) {
    console.log(`📩 Slack reply for thread ${event.thread_ts}: ${event.text}`);
  }

  return NextResponse.json({ ok: true });
}
