"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // ✅ Updated import path

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Check authentication on mount
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error.message);
      }

      if (!session) {
        router.push("/login"); // redirect if not logged in
      } else {
        setUserEmail(session.user.email);
      }

      setLoading(false);
    };

    checkUser();

    // ✅ Automatically redirect if user logs out elsewhere
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.push("/login");
        }
      }
    );

    // Cleanup listener
    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, [router]);

  // ✅ Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-[#E4B343] mb-6">Dashboard</h1>
        <p className="text-gray-300 mb-8">
          Welcome back, <span className="text-[#E4B343]">{userEmail}</span> 👋
        </p>
        <button
          onClick={handleLogout}
          className="bg-[#E4B343] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#d9a630] transition"
        >
          Log Out
        </button>
      </div>
    </main>
  );
}
