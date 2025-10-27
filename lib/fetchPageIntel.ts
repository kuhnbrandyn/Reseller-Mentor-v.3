// lib/fetchPageIntel.ts
import * as cheerio from "cheerio";

export async function fetchHomepageIntel(url: string) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (!res.ok) {
      return { error: `Failed to fetch (HTTP ${res.status})` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title + description
    const title = $("title").text() || "";
    const metaDesc = $('meta[name="description"]').attr("content") || "";

    // Extract visible text (first 3,000 chars)
    const visibleText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

    // Suspicious phrases
    const suspiciousPhrases = [
      "90% off",
      "authentic designer",
      "free shipping worldwide",
      "limited time clearance",
      "official store",
      "100% genuine",
      "paypal only",
      "telegram",
      "whatsapp",
      "luxury outlet",
      "bulk deals no refund",
    ];

    const foundPhrases = suspiciousPhrases.filter((p) =>
      visibleText.toLowerCase().includes(p.toLowerCase())
    );

    // Detect unrealistic pricing patterns
    const priceMatches = visibleText.match(/\$\d{1,2}\b/g);
    let priceAnomaly = false;
    if (priceMatches && priceMatches.length > 15) {
      priceAnomaly = true;
      foundPhrases.push("Excessive low pricing indicators ($ under 99)");
    }

    return {
      meta: { title, metaDesc },
      phrases: foundPhrases,
      priceAnomaly,
      sampleText: visibleText.slice(0, 400),
    };
  } catch (err: any) {
    console.error("fetchHomepageIntel error:", err);
    return { error: "Failed to fetch or parse homepage" };
  }
}
