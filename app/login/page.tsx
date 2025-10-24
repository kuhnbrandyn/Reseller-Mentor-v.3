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
          try {
            // ✅ Get user's profile from Supabase
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("payment_status")
              .eq("id", session.user.id)
              .single();

            if (error) {
              console.error("Profile fetch error:", error);
              router.push("/signup");
              return;
            }

            // 🚫 If unpaid, redirect to signup
            if (profile?.payment_status !== "paid") {
              router.push("/signup");
              return;
            }

            // ✅ Paid user → proceed to dashboard
            router.push("/dashboard");
          } catch (err) {
            console.error("Login check error:", err);
            router.push("/signup");
          }
        }
      }
    );

    // ✅ Cleanup listener on unmount
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

