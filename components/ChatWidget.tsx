"use client";
import { useState } from "react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const email = localStorage.getItem("user_email") || "guest_user";

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, email, context: "Website chat" }),
    });

    setLoading(false);
    if (res.ok) {
      setSent(true);
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } else {
      alert("Message failed. Please try again.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#E4B343] text-black font-semibold rounded-full px-5 py-3 shadow-lg flex items-center gap-2 hover:bg-[#f1c75a]"
        >
          💬 Chat
        </button>
      ) : (
        <div className="bg-[#111] border border-gray-700 rounded-2xl shadow-2xl w-80 h-96 flex flex-col overflow-hidden">
          <div className="bg-[#E4B343] text-black font-semibold px-4 py-2 flex justify-between items-center">
            <span>Reseller Mentor Support</span>
            <button onClick={() => setOpen(false)} className="text-black">×</button>
          </div>

          <div className="flex-1 p-3 text-sm text-gray-300 overflow-y-auto">
            {sent ? (
              <p className="text-green-400 font-medium">
                ✅ Message received! We'll respond shortly.
              </p>
            ) : (
              <p className="text-gray-500">
                👋 Have a question? Send us a message and we’ll get back to you soon.
              </p>
            )}
          </div>

          <div className="p-3 border-t border-gray-700 bg-[#000]">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-2 bg-[#111] text-white border border-gray-600 rounded-md resize-none focus:outline-none focus:border-[#E4B343]"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="mt-2 w-full bg-[#E4B343] text-black font-semibold py-2 rounded-md hover:bg-[#f1c75a]"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

