// lib/domainIntel.ts
import tls from "tls";

/**
 * 🔍 WHOIS LOOKUP (APILayer)
 * Fetches domain creation date and calculates age in years.
 * Requires:
 *   WHOIS_API_URL = https://api.apilayer.com/whois/query
 *   WHOIS_API_KEY = your actual key
 *
 * Add these in Vercel → Settings → Environment Variables.
 */
export async function getWhoisAge(domain: string): Promise<{
  ageYears: number | null;
  createdAt: string | null;
  error?: string;
}> {
  try {
    const url =
      process.env.WHOIS_API_URL || "https://api.apilayer.com/whois/query";
    const key = process.env.WHOIS_API_KEY;

    if (!key) throw new Error("Missing WHOIS_API_KEY environment variable");

    const res = await fetch(`${url}?domain=${domain}`, {
      headers: { apikey: key },
      cache: "no-store",
    });

    const text = await res.text();
    console.log("🔍 WHOIS raw:", text.slice(0, 1200)); // log partial payload for debug

    if (!res.ok) {
      throw new Error(`WHOIS API error ${res.status}: ${text}`);
    }

    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Failed to parse WHOIS JSON");
    }

    // 🔎 Normalize the field name for creation date
    const created =
      data?.result?.created ||
      data?.created ||
      data?.domain?.created ||
      data?.domain?.created_date ||
      data?.domain?.creation_date ||
      data?.registered ||
      data?.registered_date ||
      data?.registration_date ||
      data?.created_date ||
      data?.creation_date ||
      null;

    if (!created) {
      console.warn("⚠️ WHOIS: No creation date found for", domain);
      return { ageYears: null, createdAt: null, error: "No creation date found" };
    }

    const createdAt = new Date(created);
    if (isNaN(createdAt.getTime())) {
      console.warn("⚠️ WHOIS: Invalid creation date format for", domain, created);
      return { ageYears: null, createdAt: null, error: "Invalid date format" };
    }

    const years = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const result = {
      ageYears: parseFloat(years.toFixed(1)),
      createdAt: createdAt.toISOString(),
    };

    console.log("✅ WHOIS result:", result);
    return result;
  } catch (err: any) {
    console.warn("WHOIS lookup failed:", err.message || err);
    return { ageYears: null, createdAt: null, error: err.message || "WHOIS failed" };
  }
}

/**
 * 🔐 SSL STATUS CHECK
 * Validates certificate and calculates days to expiry.
 */
export async function getSslStatus(domain: string): Promise<{
  sslValid: boolean;
  sslIssuer?: string;
  sslExpires?: string;
  sslDaysRemaining?: number | null;
  error?: string;
}> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: domain, port: 443, servername: domain, timeout: 5000 },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();

        if (!cert || !cert.valid_to) {
          return resolve({ sslValid: false, error: "No SSL certificate" });
        }

        const expires = new Date(cert.valid_to);
        const remainingDays = Math.round(
          (expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        resolve({
          sslValid: remainingDays > 0,
          sslIssuer: cert.issuer?.O || cert.issuer?.CN || "Unknown",
          sslExpires: expires.toISOString(),
          sslDaysRemaining: remainingDays,
        });
      }
    );

    socket.on("error", (err) => {
      resolve({ sslValid: false, error: err.message });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ sslValid: false, error: "Timeout" });
    });
  });
}


