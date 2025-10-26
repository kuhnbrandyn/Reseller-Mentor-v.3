"use client";
import { useEffect, useState } from "react";

interface ChatMessage {
  from: "user" | "support";
  text: string;
}

export default function ChatWidget({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedOnce, setConnectedOnce] = useState(false);

  useEffect(() => {
    let evtSource: EventSource | null = null;

    // 🧠 Ensure email exists before connecting (important for signup/terms)
    const storedEmail = localStorage.getItem("user_email");
    if (!storedEmail) localStorage.setItem("user_email", "guest");

    const connectSSE = () => {
      evtSource = new EventSource("/api/chat/reply");

      evtSource.onopen = () => {
        console.log("✅ SSE connected");
        if (!connectedOnce) {
          setConnectedOnce(true);
          setMessages((prev) => [
            ...prev,
            { from: "support", text: "✅ Connected to support stream" },
          ]);
        }
      };

      evtSource.onmessage = (event) => {
        // 🩵 Ignore keep-alive pings
        if (!event.data || event.data === ":") return;

        console.log("📩 Raw SSE event:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("📦 Parsed SSE data:", data);

          // ✅ Only display replies matching this user's thread
          const currentThread = localStorage.getItem("thread_ts");

          if (
            data.type === "support_reply" &&
            data.message &&
            (!data.thread_ts || data.thread_ts === currentThread)
          ) {
            // Ignore Slack intro messages
            if (data.message.includes("New Chat")) return;

            const cleanMessage = formatSlackMessage(data.message);
            setMessages((prev) => [
              ...prev,
              { from: "support", text: cleanMessage },
            ]);
          } else if (data.connected && !connectedOnce) {
            setConnectedOnce(true);
            setMessages((prev) => [
              ...prev,
              { from: "support", text: "✅ Connected to support stream" },
            ]);
          }
        } catch (err) {
          console.warn("⚠️ Could not parse SSE message:", event.data);
        }
      };

      evtSource.onerror = (err) => {
        console.error("❌ SSE connection error:", err);
        setMessages((prev) => [
          ...prev,
          { from: "support", text: "⚠️ Connection lost. Reconnecting..." },
        ]);
        evtSource?.close();

        // Retry after short delay
        setTimeout(() => {
          console.log("🔄 Attempting SSE reconnect...");
          connectSSE();
        }, 4000);
      };
    };

    connectSSE();

    // 🔹 Local test BroadcastChannel (optional)
    const bc = new BroadcastChannel("reseller_mentor_chat");
    bc.onmessage = (event) => {
      console.log("📡 Broadcast message received:", event.data);
      setMessages((prev) => [
        ...prev,
        { from: "support", text: `📡 ${event.data.text}` },
      ]);
    };

    return () => {
      evtSource?.close();
      bc.close();
    };
  }, [connectedOnce]);

  const formatSlackMessage = (msg: string): string => {
    return msg
      .replace(/\*(.*?)\*/g, "$1") // remove *bold*
      .replace(/_(.*?)_/g, "$1") // remove _italic_
      .replace(/~(.*?)~/g, "$1") // remove ~strike~
      .replace(/:speech_balloon:/g, "💬")
      .replace(/:e-mail:/g, "📧")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const email = localStorage.getItem("user_email") || "guest";
    const threadTs = localStorage.getItem("thread_ts");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context,
          email,
          thread_ts: threadTs || null,
        }),
      });

      const data = await res.json();
      if (data.thread_ts && !threadTs) {
        localStorage.setItem("thread_ts", data.thread_ts);
        console.log("🧵 Saved new thread_ts:", data.thread_ts);
      }

      if (res.ok) {
        console.log("📤 Sent message:", message);
        setMessages((prev) => [...prev, { from: "user", text: message }]);
        setMessage("");
      } else {
        alert("⚠️ Message failed to send.");
      }
    } catch (err) {
      console.error("❌ Send failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-[#E4B343] text-black font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#cfa132] flex items-center space-x-2 z-50"
        >
          💬 <span>Chat</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-80 bg-[#111] border border-gray-800 rounded-2xl shadow-xl flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-[#E4B343] text-black font-semibold">
            <span>Reseller Mentor Support</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 text-sm overflow-y-auto bg-black">
            <p className="italic text-gray-400 mb-3">
              Hi there 👋<br />
              Send us a message and our team will reply shortly.
            </p>
            {messages.map((msg, i) => (
              <div
                key={i}




