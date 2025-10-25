import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "edge"; // ✅ required for long-lived connections

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

      const interval = setInterval(() => {
        send({ type: "ping" });
      }, 15000);

      const close = () => {
        clearInterval(interval);
        clients = clients.filter((c) => c.id !== id);
      };

      controller.enqueue(`data: ${JSON.stringify({ connected: true })}\n\n`);

      return () => close();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");
  const secret = process.env.SLACK_SIGNING_SECRET!;

  // Verify Slack request
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
  if (event && event.type === "message" && event.thread_ts && !event.bot_id) {
    console.log("💬 Reply from Slack:", event.text);
    // broadcast to all connected clients
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
