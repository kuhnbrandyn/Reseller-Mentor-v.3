"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function LoginPage() {
  const router = useRouter();
  const hasHandledInitialSession = useRef(false); // 🧠 Prevents duplicate run on cached sessions

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 🧠 Prevent redirect loops if user is already on signup or terms
        if (
          window.location.pathname === "/signup" ||
          window.location.pathname === "/terms"
        )
          return;

        // 🧠 Skip first automatic session restoration on load
        if (!hasHandledInitialSession.current) {
          hasHandledInitialSession.current = true;
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          let redirected = false;

          try {
            // ⏱ Safety timeout
            const timeout = setTimeout(() => {
              if (!redirected) {
                console.warn("Timeout: redirecting to signup fallback");
                router.replace("/signup");
                redirected = true;
              }
            }, 1200);

            // ✅ Fetch profile
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("payment_status")
              .eq("id", session.user.id)
              .maybeSingle();

            clearTimeout(timeout);

            // 🚫 No profile or error → send to signup
            if (error || !profile) {
              console.warn("No profile found or fetch error:", error);
              router.replace("/signup");
              redirected = true;
              return;
            }

            // 🚫 Unpaid users → Terms & Conditions
            if (profile.payment_status !== "paid") {
              console.warn("Unpaid user detected — redirecting to Terms");
              router.replace(`/terms?email=${encodeURIComponent(session.user.email)}`);
              redirected = true;
              return;
            }

            // ✅ Paid users → Dashboard
            router.replace("/dashboard");
            redirected = true;
          } catch (err) {
            console.error("Login check error:", err);
            router.replace("/signup");
            redirected = true;
          }
        }
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="bg-[#111] p-10 rounded-2xl border border-[#E4B343]/30 shadow-lg">
        <h1 className="text-3xl font-bold text-[#E4B343] mb-6 text-center">
          Welcome Back 👋
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Sign in or create an account to access your AI-powered reseller tools.
        </p>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#E4B343",
                  brandAccent: "#d9a630",
                  inputBackground: "#1a1a1a",
                  inputText: "white",
                  inputPlaceholder: "#aaa",
                },
              },
            },
          }}
          theme="dark"
          providers={["google"]}
        />
      </div>
    </main>
  );
}
