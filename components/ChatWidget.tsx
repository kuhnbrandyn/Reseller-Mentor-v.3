"use client";
import { useState } from "react";

export default function ChatWidget({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

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
      }

      if (res.ok) {
        setSent(true);
        setMessage("");
        setTimeout(() => setSent(false), 3000);
      } else {
        alert("⚠️ Message failed to send.");
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
      {/* Floating Chat Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-[#E4B343] text-black font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#cfa132] flex items-center space-x-2"
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
      )}

      {/* Chat Popup */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 bg-[#111] border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-[#E4B343] text-black font-semibold">
            <span>Reseller Mentor Support</span>
            <button
              onClick={() => setOpen(false)}
              className="text-black hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 text-sm text-gray-300 overflow-y-auto bg-black">
            <p className="italic text-gray-400">
              Hi there 👋<br />
              Send us a message and our team will reply shortly.
            </p>
            {sent && (
              <p className="text-green-400 mt-3">Message sent successfully ✅</p>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#111] border-t border-gray-800">
            <textarea
              className="w-full p-2 text-sm rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 resize-none"
              rows={2}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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


