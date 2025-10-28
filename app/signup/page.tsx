"use client";

import { useState, useEffect } from "react";
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
        localStorage.removeItem("thread_ts");
        if (email) {
          localStorage.setItem("user_email", email.trim());
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

  // ✅ Chat visibility patch
  useEffect(() => {
    // Ensure chat widget always visible, even on mobile
    const chatBox = document.getElementById("slack-chat-widget");
    if (chatBox) {
      chatBox.style.display = "block";
      chatBox.style.position = "fixed";
      chatBox.style.bottom = "20px";
      chatBox.style.right = "20px";
      chatBox.style.zIndex = "9999";
      chatBox.style.maxWidth = "90%";
    }
  }, []);

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
      {/* (unchanged section) */}

      {/* === SIGNUP FORM === */}
      {/* (unchanged section) */}

      {/* === TESTIMONIALS === */}
      {/* (unchanged section) */}

      {/* === WAITLIST === */}
      {/* (unchanged section) */}

      {/* === STATIC CONTACT EMAIL + COPYRIGHT === */}
      <footer className="text-center text-gray-400 mt-12 pb-6 text-sm border-t border-gray-800 pt-4 w-full">
        <p>
          Contact:{" "}
          <a
            href="mailto:support@myresellermentor.com"
            className="text-[#E4B343] hover:underline"
          >
            support@myresellermentor.com
          </a>
        </p>
        <p className="mt-1">
          &copy; {new Date().getFullYear()} My Reseller Mentor. All rights
          reserved.
        </p>
      </footer>

      {/* ✅ Always-visible Slack chat widget */}
      <div
        id="slack-chat-widget"
        className="fixed bottom-5 right-5 z-50 max-w-[90vw]"
      >
        {/* Example: if you load Slack widget via script */}
        <iframe
          src="https://your-slack-chat-url"
          className="w-[350px] h-[450px] max-w-full rounded-xl border border-[#E4B343]/30"
          title="Support Chat"
        ></iframe>
      </div>
    </main>
  );
}

