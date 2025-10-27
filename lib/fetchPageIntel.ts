// lib/fetchPageIntel.ts
import * as cheerio from "cheerio";

export async function fetchHomepageIntel(url: string) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", timeout: 8000 });
    if (!res.ok) {
      return { error: `Failed to fetch (HTTP ${res.status})` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract visible text (trim and limit to prevent token overload)
    const visibleText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

    // Extract meta and title
    const title = $("title").text() || "";
    const metaDesc = $('meta[name="description"]').attr("content") || "";

    // Suspicious phrases to look for
    const suspiciousPhrases = [
      "90% off",
      "authentic designer",
      "guaranteed authentic",
      "free shipping worldwide",
      "limited time clearance",
      "official store",
      "100% genuine",
      "cheap wholesale",
      "paypal only",
      "telegram",
      "text us on whatsapp",
      "luxury outlet",
      "bulk deals no refund",
    ];

    const foundPhrases = suspiciousPhrases.filter((p) =>
      visibleText.toLowerCase().includes(p.toLowerCase())
    );

    // Heuristic — detect unrealistic pricing patterns
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
      sampleText: visibleText.slice(0, 500), // for optional debugging
    };
  } catch (err: any) {
    console.error("fetchHomepageIntel error:", err);
    return { error: "Fetch or parse failed" };
  }
}
