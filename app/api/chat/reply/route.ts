import { NextResponse } from "next/server";

let clients: any[] = [];

export const runtime = "edge"; // works fine for Vercel SSE

// --- SSE Connection ---
export async function GET() {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const client = { controller };
        clients.push(client);

        // Keep-alive ping every 20 seconds
        const interval = setInterval(() => {
          controller.enqueue(encoder.encode(":\n\n"));
        }, 20000);

        controller.enqueue(encoder.encode("event: connected\ndata: ok\n\n"));

        // Remove client on close
        const close = () => {
          clearInterval(interval);
          clients = clients.filter((c) => c !== client);
        };
        controller.closed.then(close);
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}

// --- Slack Event Handler ---
export async function POST(req: Request) {
  const body = await req.json();

  // Slack verification (on setup)
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // Regular message from Slack (reply)
  if (body.event?.type === "message" && !body.event.bot_id) {
    const message = {
      type: "support_reply",
      message: body.event.text,
      thread_ts: body.event.thread_ts || body.event.ts,
    };

    // Broadcast to all connected browsers
    const data = `data: ${JSON.stringify(message)}\n\n`;
    clients.forEach((c) => c.controller.enqueue(new TextEncoder().encode(data)));
  }

  return NextResponse.json({ ok: true });
}

