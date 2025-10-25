import { NextResponse } from "next/server";

export const runtime = "edge";

// ✅ Debug reply handler for Slack → Site messages
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Slack sends a challenge during verification
    if (payload?.challenge) {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // ✅ Log everything from Slack
    console.log("🔹 Slack Event Received:", JSON.stringify(payload, null, 2));

    // Respond to Slack quickly to avoid timeout
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Slack Reply Error:", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

