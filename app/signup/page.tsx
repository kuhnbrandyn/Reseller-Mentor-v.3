"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email) return alert("Please enter your email.");
    if (!password) return alert("Please create a password before continuing.");
    setLoading(true);

    try {
      // ✅ STEP 1: Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("payment_status")
        .eq("email", email.trim())
        .maybeSingle();

      if (profileError) console.warn("Profile lookup error:", profileError);

      if (existingProfile) {
        if (existingProfile.payment_status === "paid") {
          alert("User is already an active member please login.");
          setLoading(false);
          router.push("/login");
          return;
        } else {
          setLoading(false);
          router.push(`/terms?email=${encodeURIComponent(email.trim())}`);
          return;
        }
      }

      // ✅ STEP 2: Check if user already exists in Auth
      const { data: adminData, error: userError } =
        await supabase.auth.admin.listUsers();

      if (!userError && adminData?.users) {
        const users = adminData.users as { email?: string }[];
        const existingAuthUser = users.find(
          (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
        );
        if (existingAuthUser) {
          setLoading(false);
          router.push(`/terms?email=${encodeURIComponent(email.trim())}`);
          return;
        }
      }

      // ✅ STEP 3: New signup (does not exist anywhere)
      if (promoCode === "ADMINFREE" || promoCode === "TESTACCESS") {
        alert("Promo accepted! Redirecting to dashboard...");
        router.push("/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setLoading(false);
          router.push(`/terms?email=${encodeURIComponent(email.trim())}`);
          return;
        }
        alert(error.message);
        setLoading(false);
        return;
      }

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

  const handleWaitlistJoin = async () => {
    if (!waitlistEmail)
      return alert("Please enter your email to join the waitlist.");
    setJoiningWaitlist(true);

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email: waitlistEmail }]);

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
        <h1 className="text-5xl font-extrabold text-[#E4B343] mb-4">
          Build a $1,000+ Sales Day Business
        </h1>
        <p className="text-gray-300 text-lg mb-8">
          Join{" "}
          <span className="text-[#E4B343] font-semibold">
            Reseller Mentor AI
          </span>{" "}
          — the only reseller membership that combines data-driven AI insights,
          ongoing supplier access, and real growth strategies built by sellers
          for sellers.
        </p>

        <div className="inline-block bg-[#111] border border-[#E4B343]/40 px-8 py-5 rounded-2xl shadow-lg mb-10">
          <p className="text-gray-400 text-sm line-through">Originally $1,200</p>
          <p className="text-4xl font-bold text-[#E4B343] mt-1">
            Limited-Time Offer: $599
          </p>
          <p className="text-gray-300 text-sm mt-1">
            <span className="text-[#E4B343] font-semibold">$49/month</span>{" "}
            billed annually
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Make your investment back within the first month of consistent
            sales.
          </p>
        </div>
      </section>

      {/* === WHAT'S INCLUDED === */}
      <section className="max-w-5xl w-full px-6 text-center mb-16">
        <h2 className="text-3xl font-bold text-[#E4B343] mb-10">
          What’s Included
        </h2>

        <div className="grid md:grid-cols-2 gap-8 text-left text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-[#E4B343] text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-white">AI Mentor for Resellers</h3>
              <p className="text-gray-400 text-sm">
                Get instant answers with strategy, data, and long-term planning
                behind every response.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#E4B343] text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-white">Ongoing Supplier Lists</h3>
              <p className="text-gray-400 text-sm">
                Updated wholesale & liquidation sources, verified and ranked for
                ROI.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#E4B343] text-2xl">🛡️</span>
            <div>
              <h3 className="font-semibold text-white">Scam Avoidance Training</h3>
              <p className="text-gray-400 text-sm">
                Learn how to vet suppliers and protect your funds while finding
                deals.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#E4B343] text-2xl">🏛️</span>
            <div>
              <h3 className="font-semibold text-white">Business Setup Guides</h3>
              <p className="text-gray-400 text-sm">
                Structure your LLC, taxes, and operations correctly for scaling.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#E4B343] text-2xl">🚚</span>
            <div>
              <h3 className="font-semibold text-white">Shipping & Pallet Mastery</h3>
              <p className="text-gray-400 text-sm">
                Learn how to buy, ship, and receive pallets with trusted freight
                contacts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#E4B343] text-2xl">🎥</span>
            <div>
              <h3 className="font-semibold text-white">Streaming & Supply Kit</h3>
              <p className="text-gray-400 text-sm">
                Recommended gear and workflows to run high-converting Whatnot
                shows like a pro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === SIGNUP FORM === */}
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
          <a
            href="/login"
            className="text-[#E4B343] underline hover:text-[#d9a630]"
          >
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


