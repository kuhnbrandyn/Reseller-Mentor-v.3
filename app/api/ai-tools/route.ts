"use client";

import { useState, useMemo } from "react";
import {
  Loader2,
  Send,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Lightbulb,
  BarChart3,
  Rocket,
  Flame,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MentorStrategyBoard() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<{ q: string; r: any; ts: number }[]>([]);
  const [copied, setCopied] = useState<string>("");

  const presets = useMemo(
    () => [
      {
        label: "Get 5 premium apparel suppliers",
        prompt:
          "Give me 5 reputable US sources for premium women's apparel liquidation (Revolve-level). Include why_good and notes.",
      },
      {
        label: "Fix slow shows (engagement)",
        prompt:
          "My live shows feel slow. Give me a quick win, a data-driven pacing plan, and a 2-week engagement schedule.",
      },
      {
        label: "Scale to $10K/week",
        prompt:
          "Build a plan to scale my Whatnot sales to $10K per week with inventory targets, show cadence, and supplier mix.",
      },
      {
        label: "Freight cost playbook",
        prompt:
          "Create a freight cost reduction playbook for pallet buys: negotiation, consolidation, and receiving SOPs.",
      },
    ],
    []
  );

  async function askMentor(p: string) {
    if (!p.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: p }),
      });
      const data = await res.json();
      const r = data?.result ?? null;
      setResult(r);
      setHistory((prev) => [{ q: p, r, ts: Date.now() }, ...prev].slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied("") , 1200);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify({ query, result }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentor-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const grid = [
    { key: "quick_win", icon: Lightbulb, title: "Quick Win" },
    { key: "data_driven", icon: BarChart3, title: "Data Driven" },
    { key: "long_term_plan", icon: Rocket, title: "Long Term Plan" },
    { key: "motivation_end", icon: Flame, title: "Motivation" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E4B343]/20 bg-black/90 px-4 py-4 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#E4B343]" />
          <h1 className="text-2xl font-bold tracking-tight">
            AI Reseller Mentor — <span className="text-[#E4B343]">Strategy Board</span>
          </h1>
          <div className="ml-auto">
            <Button
              variant="secondary"
              className="bg-[#111] border border-[#E4B343]/30 hover:bg-[#151515]"
              onClick={downloadJSON}
            >
              <Download className="h-4 w-4 mr-2" /> Export JSON
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid md:grid-cols-[280px_1fr] gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="bg-[#0a0a0a] border-[#E4B343]/30">
            <CardHeader>
              <CardTitle className="text-[#E4B343] text-sm">Playbooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setQuery(p.prompt);
                    askMentor(p.prompt);
                  }}
                  className="w-full text-left text-sm rounded-lg border border-[#E4B343]/30 bg-[#101010] hover:bg-[#141414] px-3 py-2"
                >
                  {p.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#0a0a0a] border-[#E4B343]/30">
            <CardHeader>
              <CardTitle className="text-[#E4B343] text-sm">Recent Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-xs text-gray-400">No runs yet.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="text-xs border border-[#E4B343]/20 rounded-lg p-2 bg-[#0e0e0e]">
                    <div className="line-clamp-2 opacity-90">{h.q}</div>
                    <div className="mt-2 flex gap-2">
                      <Button size="xs" className="h-7" variant="secondary" onClick={() => askMentor(h.q)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rerun
                      </Button>
                      <Button
                        size="xs"
                        className="h-7"
                        variant="secondary"
                        onClick={() => copyText(JSON.stringify(h.r, null, 2), `hist-${i}`)}
                      >
                        {copied === `hist-${i}` ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 mr-1" />
                        )}
                        {copied === `hist-${i}` ? "Copied" : "Copy JSON"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <section className="space-y-6">
          <div className="border border-[#E4B343]/30 rounded-2xl bg-[#0b0b0b] p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#E4B343]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask for a playbook, suppliers, or scaling plan…"
                className="flex-1 bg-transparent outline-none placeholder:text-gray-500 text-sm"
              />
              <Button
                onClick={() => askMentor(query)}
                disabled={loading || !query.trim()}
                className="bg-[#E4B343] text-black hover:bg-[#d9a630]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Run
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {grid.map(({ key, icon: Icon, title }) => (
              <Card key={key} className="bg-[#0a0a0a] border-[#E4B343]/30">
                <CardHeader className="pb-2 flex flex-row items-center gap-2">
                  <Icon className="h-5 w-5 text-[#E4B343]" />
                  <CardTitle className="text-base">{title}</CardTitle>
                  <div className="ml-auto" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    onClick={() => result?.[key] && copyText(result[key], key)}
                  >
                    {copied === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 mr-1" />} {copied === key ? "Copied" : "Copy"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[96px] whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                    {result?.[key] ?? <span className="text-gray-500">No output yet.</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-[#0a0a0a] border-[#E4B343]/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#E4B343]" /> Supplier Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(result?.list) && result.list.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {result.list.map((it: any, idx: number) => (
                    <div key={idx} className="border border-[#E4B343]/20 rounded-xl p-3 bg-[#0f0f0f]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-[#E4B343]">{it.name || "Unknown"}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{it.category || ""}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8"
                          onClick={() =>
                            copyText(
                              `${it.name} — ${it.why_good || ""} ${it.notes ? "(" + it.notes + ")" : ""}`,
                              `lead-${idx}`
                            )
                          }
                        >
                          {copied === `lead-${idx}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      {it.why_good && <p className="text-sm mt-2">{it.why_good}</p>}
                      {it.notes && <p className="text-xs mt-2 text-gray-400">{it.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Ask for suppliers to populate this panel.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        <div>Built for high-ROI sellers • Speed, clarity, execution.</div>
      </footer>
    </div>
  );
}














