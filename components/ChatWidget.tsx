"use client";
import { useState } from "react";

export default function ChatWidget({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const email = localStorage.getItem("user_email") || null;

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context, email }),
    });

    if (res.ok) {
      setSent(true);
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#E4B343] text-black px-5 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 transition flex items-center gap-2"
        >
          💬 Chat
        </button>
      ) : (
        <div className="relative w-80 max-w-[90vw] bg-[#1A1A1A] border border-gray-700 rounded-2xl shadow-2xl flex flex-col p-4">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
            <p className="font-semibold text-[#E4B343] text-lg">
              Reseller Mentor Support
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition text-lg"
            >
              ✕
            </button>
          </div>

          {/* Text area */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 rounded-md bg-[#111] text-gray-200 placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#E4B343] resize-none"
            rows={4}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            className="mt-3 w-full bg-[#E4B343] text-black py-2 rounded-md font-semibold hover:opacity-90 transition"
          >
            Send
          </button>

          {/* Message confirmation */}
          {sent && (
            <p className="text-center text-gray-300 text-sm mt-3">
              ✅ Message received! Our support team will reply shortly.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

