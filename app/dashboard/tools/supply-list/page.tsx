"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Supply = {
  id: string;
  supply_list: string; // matches your column name
  purchase_link: string;
};

export default function SupplyListPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplies() {
      const { data, error } = await supabase
        .from("recommended_supplies") // 👈 use your table name
        .select("id, supply_list, purchase_link")
        .order("supply_list", { ascending: true });

      if (error) console.error("❌ Supabase error:", error.message);
      else setSupplies(data || []);
      setLoading(false);
    }

    fetchSupplies();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">📦 Supply List</h1>
      <p className="text-gray-400 mb-8">
        Your go-to list of tools and supplies with direct purchase links.
      </p>

      {loading ? (
        <p>Loading supplies...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {supplies.map((item) => (
            <div
              key={item.id}
              className="bg-[#111] border border-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-3">{item.supply_list}</h3>

              <a
                href={item.purchase_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[#E4B343] text-black font-semibold py-2 rounded-md hover:bg-[#c99a2d] transition"
              >
                Visit Purchase Link 🔗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
