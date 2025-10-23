"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VaultPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [router]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("suppliers")
        .select("supplier, notes")
        .order("supplier", { ascending: true });

      if (error) console.error("Error fetching suppliers:", error);
      else setSuppliers(data || []);
      setLoading(false);
    };
    fetchSuppliers();
  }, [user]);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading Supplier Vault...</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#E4B343] mb-2">
          Supplier Vault
        </h1>
        <p className="text-gray-400">
          Exclusive list of verified sources curated for subscribers
        </p>
      </header>

      {suppliers.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No suppliers available yet.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {suppliers.map((entry, index) => (
            <div
              key={index}
              className="bg-[#111] border border-[#E4B343]/30 hover:border-[#E4B343] p-5 rounded-xl transition"
            >
              <h2 className="text-xl font-semibold text-[#E4B343]">
                {entry.supplier}
              </h2>
              <p className="text-gray-300 mt-2">{entry.notes}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
