// app/tools/start-bid-calculator/page.tsx
"use client";

import { useState } from "react";

export default function StartBidCalculator() {
  const [items, setItems] = useState<number | null>(null);
  const [lotCost, setLotCost] = useState<number | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [platformFee, setPlatformFee] = useState<number | null>(null);
  const [results, setResults] = useState<any | null>(null);

  function calculate() {
    if (!items || !lotCost || !platformFee) return;

    const totalCost = (lotCost || 0) + (shipping || 0);
    const costPerItem = totalCost / (items || 1);
    const feePerItem = (costPerItem * (platformFee || 0)) / 100;
    const allInCost = costPerItem + feePerItem;

    // Suggested start bid range (20%–30%)
    const low = allInCost * 1.2;
    const high = allInCost * 1.3;

    const netLow = low - allInCost;
    const netHigh = high - allInCost;
    const roiLow = (netLow / allInCost) * 100;
    const roiHigh = (netHigh / allInCost) * 100;

    setResults({
      totalCost,
      costPerItem,
      feePerItem,
      allInCost,
      low,
      high,
      netLow,
      netHigh,
      roiLow,
      roiHigh,
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-white">
        Live Show Start-Bid Calculator{" "}
        <span className="text-[#E4B343]">📦</span>
      </h1>
      <p className="text-gray-400 mb-8">
        Use your bulk-buy details to instantly calculate a recommended start-bid
        range for live shows — with built-in ROI and profit.
      </p>

      {/* Input Fields */}
      <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Total Items in Lot
            </label>
            <input
              type="number"
              value={items ?? ""}
              onChange={(e) => setItems(Number(e.target.value))}
              className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#E4B343]/40 focus:outline-none"
              placeholder="e.g. 200"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Lot Purchase Cost ($)
            </label>
            <input
              type="number"
              value={lotCost ?? ""}
              onChange={(e) => setLotCost(Number(e.target.value))}
              className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#E4B343]/40 focus:outline-none"
              placeholder="e.g. 2000"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Shipping / Freight ($)
            </label>
            <input
              type="number"
              value={shipping ?? ""}
              onChange={(e) => setShipping(Number(e.target.value))}
              className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#E4B343]/40 focus:outline-none"
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Platform Fees (%)
            </label>
            <input
              type="number"
              value={platformFee ?? ""}
              onChange={(e) => setPlatformFee(Number(e.target.value))}
              className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#E4B343]/40 focus:outline-none"
              placeholder="e.g. 15"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          className="mt-4 w-full bg-[#E4B343] text-black font-semibold py-2 rounded-lg hover:opacity-90 transition"
        >
          Calculate Start-Bid Range
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4 text-gray-200">
          <h2 className="text-xl font-semibold text-[#E4B343] mb-2">
            Results Summary
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <p>
              <span className="text-gray-400">Total Cost: </span>$
              {results.totalCost.toFixed(2)}
            </p>
            <p>
              <span className="text-gray-400">Cost per Item: </span>$
              {results.costPerItem.toFixed(2)}
            </p>
            <p>
              <span className="text-gray-400">Platform Fee per Item: </span>$
              {results.feePerItem.toFixed(2)}
            </p>
            <p>
              <span className="text-gray-400">All-In Cost per Item: </span>$
              {results.allInCost.toFixed(2)}
            </p>
          </div>

          <div className="mt-4 border-t border-gray-800 pt-4">
            <h3 className="text-lg font-semibold text-[#E4B343] mb-1">
              Suggested Start-Bid Range (Live Show)
            </h3>
            <p className="text-2xl font-bold text-[#E4B343]">
              ${results.low.toFixed(2)} – ${results.high.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Based on 20–30% above all-in cost.
            </p>

            {/* Net profit + ROI */}
            <div className="grid md:grid-cols-2 gap-2 mt-4 text-sm">
              <p>
                <span className="text-gray-400">Estimated Net Profit / Item: </span>
                <span className="text-green-400">
                  ${results.netLow.toFixed(2)} – ${results.netHigh.toFixed(2)}
                </span>
              </p>
              <p>
                <span className="text-gray-400">Projected ROI: </span>
                <span className="text-green-400">
                  {results.roiLow.toFixed(1)}% – {results.roiHigh.toFixed(1)}%
                </span>
              </p>
            </div>

            {/* Bar visualization */}
            <div className="mt-6 bg-black border border-gray-800 rounded-lg h-6 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gray-700"
                style={{ width: "60%" }}
              />
              <div
                className="absolute left-[60%] top-0 h-full bg-gradient-to-r from-[#E4B343] to-yellow-500"
                style={{ width: "20%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
