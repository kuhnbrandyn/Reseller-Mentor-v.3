// lib/domainIntel.ts
import tls from "tls";
import whois from "whois-json";

/**
 * 🔐 SSL + WHOIS CHECK (Free)
 * - Checks SSL validity and expiry
 * - Fetches WHOIS creation date (no API key required)
 */
export async function getSslStatus(domain: string) {
  let sslValid = false;
  let sslDaysRemaining: number | null = null;

  try {
    const cert = await new Promise<any>((resolve, reject) => {
      const socket = tls.connect(443, domain, { servername: domain }, () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        resolve(cert);
      });
      socket.on("error", reject);
    });

    if (cert && cert.valid_to) {
      const exp = new Date(cert.valid_to).getTime();
      const diffDays = Math.round((exp - Date.now()) / (1000 * 60 * 60 * 24));
      sslValid = diffDays > 0;
      sslDaysRemaining = diffDays;
    }
  } catch {
    sslValid = false;
  }

  // WHOIS Domain Age (free, no API)
  let domainAgeMonths: number | null = null;
  try {
    const data: any = await whois(domain);
    const createdRaw =
      data.creationDate ||
      data.created ||
      data["Creation Date"] ||
      data["createdDate"];

    if (createdRaw) {
      const created = new Date(createdRaw).getTime();
      domainAgeMonths = (Date.now() - created) / (1000 * 60 * 60 * 24 * 30);
    }
  } catch (err) {
    console.warn("WHOIS lookup failed:", err);
  }

  return { sslValid, sslDaysRemaining, domainAgeMonths };
}
