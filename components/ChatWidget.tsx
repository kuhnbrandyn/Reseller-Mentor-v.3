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

  useEffect(() => {
    // 🔹 Listen to server-sent events for potential future live integrations
    const evtSource = new EventSource("/api/chat/reply");

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "support_reply") {
          const userThread = localStorage.getItem("thread_ts");
          if (userThread && data.thread_ts === userThread) {
            setMessages((prev) => [
              ...prev,
              { from: "support", text: data.message },
            ]);
          }
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    evtSource.onerror = (err) => {
      console.warn("SSE connection error", err);
      evtSource.close();
      setTimeout(() => new EventSource("/api/chat/reply"), 3000);
    };

    // 🔹 Listen for Slack replies broadcasted from the server
    const bc = new BroadcastChannel("reseller_mentor_chat");
    bc.onmessage = (event) => {
      if (event.data.from === "slack") {
        setMessages((prev) => [
          ...prev,
          { from: "support", text: event.data.text },
        ]);
      }
    };

    return () => {
      evtSource.close();
      bc.close();
    };
  }, []);

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
      if (data.thread_ts && !threadTs)
        localStorage.setItem("thread_ts", data.thread_ts);

      if (res.ok) {
        setMessages((prev) => [...prev, { from: "user", text: message }]);
        setMessage("");
      } else {
        alert("⚠️ Message failed to send.");
      }
    } catch (err) {
      console.error("Send failed:", err);
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
                className={`mb-2 p-2 rounded-lg max-w-[85%] ${
                  msg.from === "user"
                    ? "ml-auto bg-[#E4B343] text-black"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-[#111] border-t border-gray-800">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Type your message..."
              className="w-full p-2 text-sm rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="mt-2 w-full bg-[#E4B343] text-black font-semibold py-2 rounded-lg hover:bg-[#cfa132] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

