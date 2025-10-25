"use client";
import { useState } from "react";

interface ChatWidgetProps {
  context?: string;
}

export default function ChatWidget({ context }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const email = localStorage.getItem("user_email") || "guest";

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context, email }),
      });

      if (res.ok) {
        setSent(true);
        setMessage("");
        setTimeout(() => setSent(false), 3000);
      } else {
        alert("⚠️ Message failed to send. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error connecting to support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 💬 Floating Chat Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 bg-[#E4B343] text-black px-4 py-2 rounded-t-xl rounded-br-xl shadow-lg font-semibold flex items-center space-x-2 hover:bg-[#f2c85a] transition-all z-50"
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
      )}

      {/* 🪟 Chat Window */}
      {open && (
        <div className="fixed bottom-6 left-6 w-80 bg-[#111] border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center bg-[#E4B343] text-black font-semibold px-4 py-2">
            <span>Reseller Mentor Support</span>
            <button
              onClick={() => setOpen(false)}
              className="text-black hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-24 p-2 rounded-lg bg-black border border-gray-700 text-white resize-none focus:outline-none focus:ring-1 focus:ring-[#E4B343]"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="w-full mt-3 bg-[#E4B343] text-black font-semibold py-2 rounded-lg hover:bg-[#f2c85a] transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>

            {sent && (
              <p className="text-green-400 text-sm text-center mt-2">
                ✅ Message received — we’ll reply shortly!
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

