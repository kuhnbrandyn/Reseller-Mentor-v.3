import { NextResponse } from "next/server";

export const runtime = "edge";

// Keep all connected SSE clients
let clients: { controller: ReadableStreamDefaultController<Uint8Array> }[] = [];

export async function GET() {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client = { controller };
      clients.push(client);
      console.log("✅ New client connected to SSE");

      // Send initial connection confirmation
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`));

      // Keep-alive ping every 25 seconds
      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(":\n\n"));
      }, 25000);

      controller.signal?.addEventListener("abort", () => {
        clearInterval(ping);
        clients = clients.filter((c) => c.controller !== controller);
        console.log("❌ Client disconnected");
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  // Slack verification handshake
  if (body?.challenge) {
    return NextResponse.json({ challenge: body.challenge });
  }

  console.log("🔹 Slack Event Received:", body);

  const event = body?.event;
  if (!event) return NextResponse.json({ ok: false });

  // Only handle message events (includes replies)
  if (event.type === "message") {
    const encoder = new TextEncoder();
    let text = event.text;
    let thread_ts = event.thread_ts || event.ts;

    if (event.subtype === "message_replied" && event.message) {
      text = event.message.text;
      thread_ts = event.message.thread_ts;
    }

    if (text) {
      console.log("💬 Forwarding message to clients:", text);
      for (const c of clients) {
        c.controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "support_reply",
              message: text,
              thread_ts,
            })}\n\n`
          )
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
