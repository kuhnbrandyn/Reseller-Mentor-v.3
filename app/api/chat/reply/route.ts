import { NextResponse } from "next/server";

export const runtime = "edge";

let clients: { id: string; controller: ReadableStreamDefaultController<Uint8Array> }[] = [];

export async function OPTIONS() {
  // Handle CORS preflight
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const id = crypto.randomUUID();
      clients.push({ id, controller });
      console.log(`✅ SSE client connected (${id}). Total: ${clients.length}`);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`));

      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":\n\n"));
        } catch {
          clearInterval(ping);
        }
      }, 25000);

      const cleanup = () => {
        clearInterval(ping);
        clients = clients.filter((c) => c.id !== id);
        console.log(`❌ SSE client disconnected (${id})`);
      };

      const signal = (controller as any).signal ?? undefined;
      if (signal) signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const body = await req.json();

  if (body?.challenge) {
    console.log("🔹 Slack verification challenge received");
    return new Response(JSON.stringify({ challenge: body.challenge }), {
      headers: corsHeaders(),
    });
  }

  const event = body?.event;
  if (!event) return new Response(JSON.stringify({ ok: false }), { headers: corsHeaders() });

  console.log("📩 Slack Event:", event);

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

    clients.forEach((c) => {
      try {
        c.controller.enqueue(encoder.encode(payload));
      } catch (err) {
        console.warn("⚠️ Failed to send to client:", err);
      }
    });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders() });
}


