import { NextResponse } from "next/server";

export const runtime = "edge";

let clients: any[] = [];
const encoder = new TextEncoder();

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const client = { controller };
      clients.push(client);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`));

      // ✅ Keep connection alive (Vercel Edge will close idle SSE otherwise)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":\n\n")); // SSE comment = ping
        } catch {}
      }, 25000);

      client.keepAlive = keepAlive;
    },
    cancel() {
      clients.forEach((c) => clearInterval(c.keepAlive));
      clients = clients.filter((c) => c.controller !== this);
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

export async function POST(req: Request

