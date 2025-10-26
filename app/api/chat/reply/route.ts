import { NextResponse } from "next/server";

export const runtime = "edge";

let clients: { id: string; controller: ReadableStreamDefaultController<Uint8Array> }[] = [];

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const id = crypto.randomUUID();
      const client = { id, controller };
      clients.push(client);

      console.log(`✅ SSE client connected (${id}). Total: ${clients.length}`);

      // Send initial event to confirm connection
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`));

      // Keep-alive ping every 25s (required for Safari)
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":\n\n"));
        } catch (err) {
          console.warn(`⚠️ Ping failed for client ${id}:`, err);
          cleanup();
        }
      }, 25000);

      // Proper close handler
      const cleanup = () => {
        clearInterval(ping);
        clients = clients.filter((c) => c.id !== id);
        console.log(`❌ SSE client disconnected (${id}). Remaining: ${clients.length}`);
      };

      // Detect when browser closes connection
      const signal = (controller as any).signal ?? undefined;
      if (signal) signal.addEventListener("abort", cleanup);
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
  const encoder = new TextEncoder();
  const body = await req.json();

  // Slack verification handshake
  if (body?.challenge) {
    console.log("🔹 Slack verification challenge received");
    return NextResponse.json({ challenge: body.challenge });
  }

  const event = body?.event;
  if (!event) return NextResponse.json({ ok: false });

  console.log("📩 Slack Event:", event);

  // Handle Slack message + thread replies
  let text: string | undefined;
  let thread_ts: string | undefined;

  if (event.type === "message") {
    if (event.subtype === "message_replied" && event.message) {
      text = event.message.text;
      thread_ts = event.message.thread_ts;
    } else {
      text = event.text;
      thread_ts = event.thread_ts || event.ts;
    }
  }

  if (text) {
    console.log("💬 Broadcasting to connected clients:", text);

    const payload = `data: ${JSON.stringify({
      type: "support_reply",
      message: text,
      thread_ts,
    })}\n\n`;

    // Send to all open SSE clients
    clients.forEach((c) => {
      try {
        c.controller.enqueue(encoder.encode(payload));
      } catch (err) {
        console.warn("⚠️ Failed to send to client:", err);
      }
    });
  }

  return NextResponse.json({ ok: true });
}


