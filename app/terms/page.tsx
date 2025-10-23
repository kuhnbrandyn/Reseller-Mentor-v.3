"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TermsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Get current Supabase user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, [router]);

  // ✅ Handle agreement + Stripe redirect
  const handleAcknowledge = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ✅ Save acknowledgment in Supabase
      const { error: insertError } = await supabase
        .from("profiles") // 👈 use the profiles table you just created
        .upsert({
          id: user.id,
          email: user.email,
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Supabase error:", insertError);
        alert("There was an issue saving your acknowledgment.");
        setLoading(false);
        return;
      }

      // ✅ Create Stripe checkout session
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Error creating checkout session.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading...
      </div>
    );

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#E4B343]/40 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-[#E4B343] text-center mb-6">
          Terms of Use & Acknowledgement
        </h1>

        {/* Scrollable Terms Box */}
        <div className="border border-[#E4B343]/30 rounded-lg p-4 mb-6 h-[300px] overflow-y-scroll text-gray-300 text-sm leading-relaxed">
          <p className="mb-3">
            Welcome to Reseller Mentor AI — an educational platform designed to
            help resellers grow their business through insights, tools, and
            strategies.
          </p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>
              <strong>Educational Purpose Only –</strong> The information and
              guidance provided by Reseller Mentor AI, its tools, or any
              associated materials are for educational and informational
              purposes only.
            </li>
            <li>
              <strong>No Legal, Financial, or Tax Advice –</strong> Nothing on
              this platform should be interpreted as legal, accounting, tax, or
              investment advice. Consult qualified professionals for such
              matters.
            </li>
            <li>
              <strong>No Earnings or Performance Guarantees –</strong> While
              proven strategies are shared, results will vary depending on your
              own effort, business model, and market conditions.
            </li>
            <li>
              <strong>Personal Responsibility –</strong> You assume full
              responsibility for any actions or outcomes that result from using
              the platform, content, or tools.
            </li>
            <li>
              <strong>Non-Refundable Subscription –</strong> All purchases are
              final. Since content and AI features are delivered instantly,
              refunds cannot be provided.
            </li>
            <li>
              <strong>Respectful Use –</strong> You agree to use Reseller Mentor
              AI responsibly and not share proprietary content or engage in
              unlawful behavior.
            </li>
          </ol>
          <p className="mt-4 text-[#E4B343] italic">
            By proceeding, you confirm that you have read and agree to these
            Terms of Use.
          </p>
        </div>

        {/* Checkbox */}
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mr-3 accent-[#E4B343] w-5 h-5"
          />
          <label className="text-gray-300 text-sm">
            I have read and agree to these Terms of Use.
          </label>
        </div>

        {/* Button */}
        <button
          onClick={handleAcknowledge}
          disabled={!agreed || loading}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            agreed
              ? "bg-[#E4B343] text-black hover:bg-[#d9a630]"
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          }`}
        >
          {loading ? "Processing..." : "Acknowledge & Continue"}
        </button>
      </div>
    </main>
  );
}

