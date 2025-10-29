"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase (client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /* 🔐 Get Supabase Auth user on load */
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || buttonDisabled || !userId) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userMessage.content,
          user_id: userId,
        }),
      });

      const data = await res.json();

      // ⚠️ Handle near-cap and capped usage
      if (data?.usage?.near_cap) {
        alert(
          `⚠️ You’ve used ${data.usage.usage_pct}% of your yearly AI allowance.`
        );
      }

      if (data?.usage?.capped) {
        alert("⛔ You’ve hit your $100 yearly AI cap.");
        setButtonDisabled(true);
      }

      // ✅ If valid result
      if (data?.result) {
        const r = data.result;

        // 🧩 Step 2: Show supplier list only when relevant
        let supplierList = "";
        const lowerInput = userMessage.content.toLowerCase();
        const supplierKeywords = [
          "supplier",
          "suppliers",
          "wholesaler",
          "wholesalers",
          "liquidation",
          "sourcing",
          "vendor",
          "vendors",
        ];
        const isSupplierQuery = supplierKeywords.some((kw) =>
          lowerInput.includes(kw)
        );

        if (
          isSupplierQuery &&
          r.list &&
          Array.isArray(r.list) &&
          r.list.length > 0
        ) {
          supplierList = "\n\n📦 **Suggested Suppliers:**\n";
          r.list.forEach((s: any, i: number) => {
            supplierList += `\n${i + 1}. **${s.name}** — ${s.category}\n   🔹 ${
              s.why_good
            }\n   📝 ${s.notes}\n`;
          });
        }

        const formatted = `
💡 **Quick Win:** ${r.quick_win || "N/A"}

📊 **Data Driven:** ${r.data_driven || "N/A"}

🚀 **Long Term Plan:** ${r.long_term_plan || "N/A"}

🔥 **Motivation:** ${r.motivation_end || "Stay consistent!"}
${supplierList}
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
            placeholder={
              buttonDisabled
                ? "Usage limit reached — please renew."
                : "Ask your AI mentor..."
            }
            className="flex-1 px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none focus:border-[#E4B343]"
            disabled={buttonDisabled || loading || !userId}
          />
          <button
            type="submit"
            disabled={loading || buttonDisabled || !userId}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              buttonDisabled
                ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                : "bg-[#E4B343] text-black hover:bg-[#d9a630]"
            }`}
          >
            {buttonDisabled
              ? "Limit Reached"
              : !userId
              ? "Loading..."
              : loading
              ? "Sending..."
              : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}



