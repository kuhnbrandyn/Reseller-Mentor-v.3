import { NextResponse } from "next/server";

export const runtime = "edge";

let clients: any[] = [];

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const client = { controller };
      clients.push(client);
      controller.enqueue(`data: ${JSON.stringify({ connected: true })}\n\n`);
    },
    cancel() {
      clients = clients.filter((c) => c.controller !== this);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  // ✅ Slack verification handshake
  if (body?.challenge) {
    return NextResponse.json({ challenge: body.challenge });
  }

  console.log("🔹 Slack Event Received:", body);

  const event = body?.event;
  if (!event) return NextResponse.json({ ok: false });

  /**
   * ✅ Catch all message-based events:
   * - Regular new messages
   * - Thread replies (Slack sends them as subtype: message_replied)
   */
  if (event.type === "message") {
    let text = event.text;
    let thread_ts = event.thread_ts || event.ts;

    // Handle threaded reply payload structure
    if (event.subtype === "message_replied" && event.message) {
      text = event.message.text;
      thread_ts = event.message.thread_ts;
    }

    if (text) {
      console.log("💬 Forwarding message to clients:", text);
      clients.forEach((c) => {
        c.controller.enqueue(
          `data: ${JSON.stringify({
            type: "support_reply",
            message: text,
            thread_ts,
          })}\n\n`
        );
      });
    }
  }

  return NextResponse.json({ ok: true });
}

