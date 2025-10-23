"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // ✅ fixed import path
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // ✅ Listen for authentication changes
    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard");
      }
    });

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
