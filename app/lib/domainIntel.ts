// lib/domainIntel.ts
import tls from "tls";

/**
 * WHOIS: get domain age in years
 * Uses the ipwhois.io API (free tier ~10k/month)
 */
export async function getWhoisAge(domain: string) {
  try {
    const res = await fetch(`https://ipwhois.app/json/${domain}`);
    const data = await res.json();

    if (!data || !data.created) {
      return { ageYears: null, createdAt: null, error: "No creation date found" };
    }

    const createdAt = new Date(data.created);
    const years = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);

    return { ageYears: parseFloat(years.toFixed(1)), createdAt: createdAt.toISOString() };
  } catch (err) {
    console.warn("WHOIS lookup failed:", err);
    return { ageYears: null, createdAt: null, error: "WHOIS fetch failed" };
  }
}

/**
 * SSL: check for valid certificate
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
