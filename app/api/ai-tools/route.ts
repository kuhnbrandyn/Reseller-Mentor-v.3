"use client";

import { useState } from "react";

type AnalyzerResult = {
  trust_score: number;
  risk_level: "Low" | "Moderate" | "High" | string;
  summary: string;
  positives: string[];
  red_flags: string[];
  notes?: string[];
  _raw?: string;
};

export default function SupplierAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzerResult | null>(null);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 55) return "text-yellow-400";
    return "text-red-400";
  };

  async function runAnalysis() {
    setError(null);
    setResult(null);

    if (!/^https?:\/\//i.test(url)) {
      setError("Please enter a full URL including https://");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "supplier-analyzer",
          input: url,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-gray-200">
      <h1 className="text-3xl font-bold mb-2 text-white">Supplier Analyzer 🔍</h1>
      <p className="text-gray-400 mb-6">
        Paste a supplier website to get a trust score, red flags, and a short summary before you buy.
      </p>

      {/* Input Section */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E4B343]"
        />
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-[#E4B343] text-black font-semibold px-5 py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Supplier"}
        </button>
      </div>

      {error && (
        <div className="text-red-400 bg-red-950 border border-red-800 rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="bg-[#0c0c0c] border border-gray-800 rounded-xl p-6 mt-6">
          <p className={`text-4xl font-bold ${scoreColor(result.trust_score)}`}>
            {result.trust_score} / 100
          </p>
          <p className="text-gray-400 font-medium">
            Risk Level:{" "}
            <span
              className={`${
                result.risk_level === "Low"
                  ? "text-green-400"
                  : result.risk_level === "Moderate"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {result.risk_level}
            </span>
          </p>

          <h2 className="text-xl font-semibold text-white mt-6 mb-2">Summary</h2>
          <p className="text-gray-300 leading-relaxed">{result.summary}</p>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-[#111] border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                Positives
              </h3>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                {result.positives.length > 0 ? (
                  result.positives.map((pos, i) => <li key={i}>{pos}</li>)
                ) : (
                  <li>No major positives detected.</li>
                )}
              </ul>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Red Flags
              </h3>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                {result.red_flags.length > 0 ? (
                  result.red_flags.map((flag, i) => <li key={i}>{flag}</li>)
                ) : (
                  <li>No significant red flags detected.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg border border-gray-800 bg-[#111] text-gray-400 text-sm leading-relaxed">
            <p>
              ⚠️ <span className="text-[#E4B343] font-semibold">Important:</span>{" "}
              This trust score is based only on publicly available website data.
              It should not be the sole factor in your decision-making. Always
              complete all steps in the{" "}
              <span className="text-[#E4B343] font-semibold">
                Scam Avoidance
              </span>{" "}
              guide before making purchases.
            </p>
            <p className="mt-3">
              💬 If you find a questionable supplier, please email our team at{" "}
              <a
                href="mailto:support@myresellermentor.com"
                className="text-[#E4B343] underline hover:text-yellow-400"
              >
                support@myresellermentor.com
              </a>{" "}
              and we’ll review it and share our professional opinion to help
              protect the community.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}











