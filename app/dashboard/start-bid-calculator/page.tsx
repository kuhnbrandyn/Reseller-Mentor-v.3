"use client";

import { useState } from "react";

export default function StartBidCalculator() {
  const [lotCost, setLotCost] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(15); // default %
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    // allow shipping to be 0, but lot cost + items must be > 0
    if (!lotCost || !totalItems) return;

    const totalCost = lotCost + (shippingCost || 0);
    const costPerItem = totalCost / totalItems;
    const feePerItem = costPerItem * (platformFee / 100);
    const allInCost = costPerItem + feePerItem;

    // Suggested Start Bid Range (20–30% above all-in cost)
    const suggestedLow = allInCost * 1.2;
    const suggestedHigh = allInCost * 1.3;

    // Estimated Net Profit Per Item
    const netProfitLow = suggestedLow - allInCost;
    const netProfitHigh = suggestedHigh - allInCost;

    // ROI % range (still 20–30% markup)
    const roiLow = 20;
    const roiHigh = 30;

    // ✅ Total Potential Profit (for the full lot)
    const potentialLow = netProfitLow * totalItems;
    const potentialHigh = netProfitHigh * totalItems;

    setResults({
      totalCost,
      costPerItem,
      feePerItem,
      allInCost,
      suggestedLow,
      suggestedHigh,
      netProfitLow,
      netProfitHigh,
      roiLow,
      roiHigh,
      potentialLow,
      potentialHigh,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <h1 className="text-3xl font-bold text-[#E4B343] mb-2">
        Live Show Start-Bid Calculator 📦
      </h1>
      <p className="text-gray-400 mb-8">
        Enter your bulk buy details to calculate suggested live show starting bids and profit
        potential.
      </p>

      {/* === Input Section === */}
      <div className="bg-[#0A0A0A] border border-[#E4B343]/40 rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Lot Cost ($)</label>
            <input
              type="number"
              value={lotCost || ""}
              onChange={(e) => setLotCost(parseFloat(e.target.value))}
              className="w-full p-2 bg-black border border-gray-700 rounded-md text-white"
              placeholder="e.g. 2000"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Shipping Cost ($)</label>
            <input
              type="number"
              value={shippingCost || ""}
              onChange={(e) => setShippingCost(parseFloat(e.target.value))}
              className="w-full p-2 bg-black border border-gray-700 rounded-md text-white"
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Total Items in Lot</label>
            <input
              type="number"
              value={totalItems || ""}
              onChange={(e) => setTotalItems(parseFloat(e.target.value))}
              className="w-full p-2 bg-black border border-gray-700 rounded-md text-white"
              placeholder="e.g. 200"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Platform Fee (%)</label>
            <input
              type="number"
              value={platformFee || ""}
              onChange={(e) => setPlatformFee(parseFloat(e.target.value))}
              className="w-full p-2 bg-black border border-gray-700 rounded-md text-white"
              placeholder="e.g. 15"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="mt-4 w-full md:w-auto bg-[#E4B343] hover:bg-[#d2a53b] text-black font-semibold py-2 px-6 rounded-md transition"
        >
          Calculate
        </button>
      </div>

      {/* === Results Section === */}
      {results && (
        <div className="mt-8 bg-[#0A0A0A] border border-[#E4B343]/40 rounded-2xl p-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-[#E4B343] mb-4">Results Summary</h2>

          <div className="grid md:grid-cols-2 gap-4 text-gray-300 text-sm mb-4">
            <p>
              <span className="text-gray-400">Total Cost:</span>{" "}
              <span className="font-semibold">${results.totalCost.toFixed(2)}</span>
            </p>
            <p>
              <span className="text-gray-400">Cost per Item:</span>{" "}
              <span className="font-semibold">${results.costPerItem.toFixed(2)}</span>
            </p>
            <p>
              <span className="text-gray-400">Platform Fee per Item:</span>{" "}
              <span className="font-semibold">${results.feePerItem.toFixed(2)}</span>
            </p>
            <p>
              <span className="text-gray-400">All-In Cost per Item:</span>{" "}
              <span className="font-semibold">${results.allInCost.toFixed(2)}</span>
            </p>
          </div>

          <hr className="border-gray-800 my-4" />

          <div className="text-gray-300">
            <p className="text-[#E4B343] text-lg font-semibold mb-1">
              Suggested Start-Bid Range (Live Show)
            </p>
            <p className="text-2xl font-bold text-[#E4B343]">
              ${results.suggestedLow.toFixed(2)} – ${results.suggestedHigh.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Based on {results.roiLow}%–{results.roiHigh}% above all-in cost.
            </p>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <p>
              Estimated Net Profit / Item:{" "}
              <span className="text-green-400 font-semibold">
                ${results.netProfitLow.toFixed(2)} – ${results.netProfitHigh.toFixed(2)}
              </span>
            </p>
            <p>
              Projected ROI (per item):{" "}
              <span className="text-green-400 font-semibold">
                {results.roiLow.toFixed(1)}% – {results.roiHigh.toFixed(1)}%
              </span>
            </p>
          </div>

          <hr className="border-gray-800 my-4" />

          <div className="text-gray-300">
            <p className="text-[#E4B343] text-lg font-semibold mb-1">
              💰 Total Potential Profit (Entire Lot)
            </p>

            <p className="text-2xl font-bold text-green-400">
              ${results.potentialLow.toLocaleString()} – ${results.potentialHigh.toLocaleString()}
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Based on net profit per item × {totalItems} items.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

