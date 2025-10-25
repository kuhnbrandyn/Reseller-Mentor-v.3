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
      setTimeout(() => setSent(false), 3000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#E4B343] text-black px-4 py-3 rounded-full font-semibold shadow-md hover:opacity-90 transition"
        >
          💬 Chat
        </button>
      ) : (
        <div className="w-80 bg-[#1A1A1A] border border-gray-700 rounded-2xl shadow-2xl p-4 text-gray-100">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-[#E4B343] text-lg">
              Reseller Mentor Support
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition"
            >
              ✕
            </button>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-2 rounded-md bg-[#111] text-gray-200 placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E4B343]"
            rows={3}
          />

          <button
            onClick={sendMessage}
            className="mt-3 w-full bg-[#E4B343] text-black py-2 rounded-md font-semibold hover:opacity-90 transition"
          >
            Send
          </button>

          {sent && (
            <p className="text-green-400 text-sm mt-2 text-center">
              Message sent ✅
            </p>
          )}
        </div>
      )}
    </div>
  );
}

