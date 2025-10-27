// app/tools/supplier-analyzer/page.tsx
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
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  async function runAnalysis() {
    setError(null);
    setResult(null);

    const clean = url.trim();
    if (!/^https?:\/\/\S+/i.test(clean)) {
      setError("Please enter a full URL starting with http(s)://");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "supplier-analyzer", input: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unknown error. Please try again.");
      } else if (data?.data) {
        setResult(data.data as AnalyzerResult);
      } else {
        setError("No data returned. Please try again.");
      }
    } catch (e: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">
        Supplier Analyzer <span className="text-[#E4B343]">🔍</span>
      </h1>
      <p className="text-gray-400 mb-6">
        Paste a supplier website to get a trust score, red flags, and a short
        summary before you buy.
      </p>

      <div className="bg-[#111] border border-gray-800 rounded-xl p-4 mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Supplier URL
        </label>
        <div className="flex gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example-supplier.com"
            className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E4B343]/40"
          />
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="whitespace-nowrap rounded-lg px-4 py-2 bg-[#E4B343] text-black font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Supplier"}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <p className="text-xs text-gray-500 mt-3">
          Tip: Use the full URL including <span className="text-gray-300">https://</span>
        </p>
      </div>

      {result && (
        <div className="bg-[#111] border border-gray-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              <div className="text-sm text-gray-400">Trust Score</div>
              <div className={`text-3xl font-bold ${scoreColor(result.trust_score)}`}>
                {Math.round(result.trust_score)} / 100
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Risk Level:{" "}
                <span className="text-gray-200">{result.risk_level}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-gray-300 leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-gray-200">Positives</h4>
              {result.positives?.length ? (
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {result.positives.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">None detected.</p>
              )}
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-gray-200">Red Flags</h4>
              {result.red_flags?.length ? (
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {result.red_flags.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">None detected.</p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
            ⚠️ Always validate with a small test order. This AI report is informational and not legal advice.
          </div>

          {result._raw && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">Raw response</summary>
              <pre className="mt-2 p-2 bg-black/50 rounded border border-gray-800 overflow-x-auto">
                {result._raw}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
