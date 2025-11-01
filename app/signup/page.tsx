"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email) return alert("Please enter your email.");
    if (!password) return alert("Please create a password before continuing.");
    setLoading(true);

    try {
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
        localStorage.removeItem("thread_ts");
        if (email) {
          localStorage.setItem("user_email", email.trim());
        }

        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
            }),
          });

          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          } else {
            console.error("Checkout error:", data.error);
          }
        } catch (err) {
          console.error("Error creating checkout session:", err);
        }

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
        {/* ... all your included features remain unchanged ... */}
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
          className="w-full mb-6 px-4 py-3 rounded-lg border border-gray-700 bg-transparent text-white focus:border-[#E4B343] focus:outline-none"
        />
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-[#E4B343] text-black py-3 rounded-lg font-semibold hover:bg-[#d9a630] transition"
        >
          {loading ? "Processing..." : "Join Now"}
        </button>
        {/* 🆕 Promo note */}
        <p className="text-gray-500 text-xs mt-3">
          Promo codes applied at checkout
        </p>
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

      {/* === TESTIMONIALS, WAITLIST, FOOTER === */}
      {/* (unchanged, keep all existing sections) */}
    </main>
  );
}


