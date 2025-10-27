"use client";
import { useState } from "react";

export default function AIMentor() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey 👋 I'm your AI Reseller Mentor! What do you want to work on today — sourcing, live show engagement, or scaling profits?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // ✅ Send to your AI Mentor API route
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userMessage.content }),
      });

      const data = await res.json();

      if (data?.result) {
        const r = data.result;
        const formatted = `
💡 **Quick Win:** ${r.quick_win || "N/A"}

📊 **Data Driven:** ${r.data_driven || "N/A"}

🚀 **Long Term Plan:** ${r.long_term_plan || "N/A"}

🔥 **Motivation:** ${r.motivation_end || "Stay consistent!"}
        `.trim();

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: formatted },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Hmm, I didn’t catch that. Try again?",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Network error — please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
      <div className="w-full max-w-3xl bg-[#0A0A0A] border border-[#E4B343]/40 rounded-2xl p-6 flex flex-col h-[75vh]">
        <h1 className="text-3xl font-bold text-[#E4B343] mb-6 text-center">
          AI Reseller Mentor
        </h1>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl max-w-[80%] whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-[#E4B343] text-black self-end ml-auto"
                  : "bg-[#111] border border-[#E4B343]/30 text-white"
              }`}
              dangerouslySetInnerHTML={{ __html: msg.content }}
            />
          ))}
          {loading && <p className="text-gray-400 italic">Typing...</p>}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI mentor..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none focus:border-[#E4B343]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#E4B343] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#d9a630] transition"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

