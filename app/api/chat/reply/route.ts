import { NextResponse } from "next/server";

export const runtime = "edge"; // ✅ Edge-compatible

let clients: { id: string; send: (data: any) => void }[] = [];

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const id = crypto.randomUUID();
      const send = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      clients.push({ id, send });
      send({ type: "connected", id });

      const interval = setInterval(() => send({ type: "ping" }), 15000);

      const close = () => {
        clearInterval(interval);
        clients = clients.filter((c) => c.id !== id);
      };

      controller.enqueue(`data: ${JSON.stringify({ connected: true })}\n\n`);
      return () => close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ✅ Helper for Slack signature verification using Web Crypto
async function verifySlackSignature({
  body,
  timestamp,
  signature,
  secret,
}: {
  body: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
}) {
  if (!timestamp || !signature) return false;

  const baseString = `v0:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(baseString)
  );
  const computed =
    "v0=" +
    Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return computed === signature;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");
  const secret = process.env.SLACK_SIGNING_SECRET!;

  const isValid = await verifySlackSignature({
    body: rawBody,
    timestamp,
    signature,
    secret,
  });
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const payload = JSON.parse(rawBody);
  if (payload.type === "url_verification") {
    return new Response(payload.challenge, { status: 200 });
  }

  const event = payload.event;
  if (event && event.type === "message" && event.thread_ts && !event.bot_id) {
    console.log("💬 Reply from Slack:", event.text);
    clients.forEach((client) =>
      client.send({
        type: "support_reply",
        thread_ts: event.thread_ts,
        message: event.text,
      })
    );
  }

  return NextResponse.json({ ok: true });
}

