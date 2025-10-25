import { NextResponse } from "next/server";

export const runtime = "edge"; // required for Vercel

let clients: any[] = [];

// === 1. SSE connection handler ===
export async function GET(req: Request) {
  const { signal } = req; // supports abort (close) event

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const client = { controller };
        clients.push(client);

        // Keep connection alive every 20s
        const interval = setInterval(() => {
          controller.enqueue(encoder.encode(":\n\n"));
        }, 20000);

        // If user disconnects, cleanup
        signal.addEventListener("abort", () => {
          clearInterval(interval);
          clients = clients.filter((c) => c !== client);
        });

        // Confirm connection
        controller.enqueue(encoder.encode("event: connected\ndata: ok\n\n"));
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

// === 2. Slack event handler ===
export async function POST(req: Request) {
  const body = await req.json();

  // Slack verification (first setup)
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // Handle Slack replies (non-bot messages)
  if (body.event?.type === "message" && !body.event.bot_id) {
    const message = {
      type: "support_reply",
      message: body.event.text,
      thread_ts: body.event.thread_ts || body.event.ts,
    };

    const data = `data: ${JSON.stringify(message)}\n\n`;
    clients.forEach((c) => c.controller.enqueue(new TextEncoder().encode(data)));
  }

  return NextResponse.json({ ok: true });
}

