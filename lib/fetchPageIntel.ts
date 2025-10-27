// lib/fetchPageIntel.ts
import * as cheerio from "cheerio";

/**
 * Fetch homepage HTML and extract basic metadata and price-related phrases
 */
export async function fetchHomepageIntel(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return { error: `Failed to load homepage (${res.status})`, meta: {}, phrases: [], rawText: "" };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").text().trim();
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const metaKeywords = $('meta[name="keywords"]').attr("content") || "";

    // Extract visible text (very basic)
    const text = $("body").text().replace(/\s+/g, " ").toLowerCase();

    // Common suspicious marketing phrases
    const suspiciousPatterns = [
      /90%\s*off/g,
      /80%\s*off/g,
      /authentic\s+designer/g,
      /free\s+shipping/g,
      /guaranteed\s+authentic/g,
      /limited\s*time\s*offer/g,
      /wholesale\s+price/g,
      /clearance\s+sale/g,
      /factory\s*outlet/g,
      /luxury\s+replica/g,
    ];

    const matchedPhrases = suspiciousPatterns
      .filter((re) => re.test(text))
      .map((re) => re.source.replace(/\\s\*/g, " "));

    return {
      error: null,
      meta: { title, metaDesc, metaKeywords },
      phrases: matchedPhrases,
      rawText: text.slice(0, 1000), // first 1k chars for GPT reference
    };
  } catch (err: any) {
    return { error: err.message || "Failed to fetch homepage", meta: {}, phrases: [], rawText: "" };
  }
}
