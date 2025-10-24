"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          let redirected = false;

          try {
            // ⏱ Add a manual timeout safety net (prevents infinite hang)
            const timeout = setTimeout(() => {
              if (!redirected) {
                console.warn("Timeout: redirecting to signup fallback");
                router.replace("/signup");
                redirected = true;
              }
            }, 1200);

            // ✅ Fetch profile safely
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("payment_status")
              .eq("id", session.user.id)
              .single({ head: false }); // handles no-row cases cleanly

            clearTimeout(timeout); // stop fallback timer if query resolves

            // 🚫 Redirect if no profile or fetch error
            if (error || !profile) {
              console.warn("No profile found or fetch error:", error);
              router.replace("/signup");
              redirected = true;
              return;
            }

            // 🚫 Redirect unpaid
            if (profile.payment_status !== "paid") {
              router.replace("/signup");
              redirected = true;
              return;
            }

            // ✅ Paid user → dashboard
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

