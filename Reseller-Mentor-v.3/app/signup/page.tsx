"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Waitlist states
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  const router = useRouter();

  // --- SIGNUP FUNCTION ---
  const handleSignup = async () => {
    if (!email) return alert("Please enter your email.");
    if (!password) return alert("Please create a password before continuing.");
    setLoading(true);

    try {
      // ✅ Promo bypass
      if (promoCode === "ADMINFREE" || promoCode === "TESTACCESS") {
        alert("Promo accepted! Redirecting to dashboard...");
        router.push("/dashboard");
        return;
      }

      // ✅ Create Supabase user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      console.log("✅ Supabase signup success:", data);

      // ✅ Redirect to Terms page before checkout
      if (data?.user) {
        router.push(`/terms?email=${encodeURIComponent(email)}`);
        return;
      }
    } catch (err) {
      console.error("❌ Signup error:", err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // --- WAITLIST FUNCTION ---
  const handleWaitlistJoin = async () => {
    if (!waitlistEmail) return alert("Please enter your email to join the waitlist.");
    setJoiningWaitlist(true);

    try {
      const { error } = await supabase.from("waitlist").insert([{ email: waitlistEmail }]);
      if (error) {
        alert("This email is already on the waitlist or invalid.");
      } else {
        alert("🎉 You're on the waitlist! We'll notify you soon.");
        setWaitlistEmail("");
      }
    } catch (err) {
      console.error("Waitlist error:", err);
      alert("Something went wrong while adding you to the waitlist.");
    } finally {
      setJoiningWaitlist(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* === HERO === */}
      <section className="text-center mt-16 max-w-3xl px-6">
        <h1 className="text-5xl font-extrabold text-[#E4B343] mb-6">
          Join the Reseller Mentor AI Community
        </h1>
        <p className="text-gray-300 mb-10 text-lg">
          Learn, scale, and automate your reselling business. Get access to{" "}
          <span className="text-[#E4B343] font-semibold">
            exclusive tools, supplier lists, and live training.
          </span>
        </p>
      </section>

      {/* === FORM === */}
      <section className="bg-[#111] border border-[#E4B343]/40 rounded-2xl p-10 w-[90%] max-w-md text-center shadow-lg mb-10">
        <h2 className="text-3xl font-bold mb-6 text-[#E4B343]">Sign Up</h2>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:border-[#E4B343] focus:outline-none"
        />

        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:border-[#E4B343] focus:outline-none"
        />

        <input
          type="text"
          placeholder="Promo code (optional)"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:border-[#E4B343] focus:outline-none"
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-[#E4B343] text-black py-3 rounded-lg font-semibold hover:bg-[#d9a630] transition"
        >
          {loading ? "Processing..." : "Join Now"}
        </button>

        <p className="text-gray-400 mt-6 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-[#E4B343] underline hover:text-[#d9a630]">
            Log In
          </a>
        </p>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="max-w-5xl w-full px-6 grid md:grid-cols-3 gap-6 text-center mb-16">
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 shadow-md">
          <p className="italic text-gray-400">
            “I scaled my Whatnot sales 2x using tips from Reseller Mentor AI!”
          </p>
          <p className="text-[#E4B343] mt-3 font-semibold">— Amanda R.</p>
        </div>
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 shadow-md">
          <p className="italic text-gray-400">
            “The Supplier Vault saved me weeks of sourcing time.”
          </p>
          <p className="text-[#E4B343] mt-3 font-semibold">— Chris M.</p>
        </div>
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 shadow-md">
          <p className="italic text-gray-400">
            “Worth every penny. Finally a mentor who gets reselling!”
          </p>
          <p className="text-[#E4B343] mt-3 font-semibold">— Jenna L.</p>
        </div>
      </section>

      {/* === WAITLIST === */}
      <section className="w-full bg-black py-12 text-center border-t border-[#E4B343]/30">
        <h3 className="text-2xl font-semibold mb-4 text-[#E4B343]">
          Want early access to new AI features?
        </h3>
        <p className="text-gray-300 mb-4">
          Join the waitlist and be first to test beta tools and supplier updates.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4 items-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={waitlistEmail}
            onChange={(e) => setWaitlistEmail(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:border-[#E4B343] focus:outline-none w-72"
          />
          <button
            onClick={handleWaitlistJoin}
            disabled={joiningWaitlist}
            className="bg-[#E4B343] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#d9a630] transition"
          >
            {joiningWaitlist ? "Joining..." : "Join Waitlist"}
          </button>
        </div>
      </section>
    </main>
  );
}
