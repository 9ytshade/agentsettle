export function sanitizeText(text: string, maxLength = 10_000): string {
  if (!text) return "";
  return text.trim().slice(0, maxLength);
}

export function formatAddress(address: string): string {
  if (!address) return "0x000...0000";
  const clean = address.trim();
  if (clean.length < 10) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

export function formatGen(wei: bigint | string | number): string {
  try {
    const b = BigInt(wei);
    const whole = b / 10n ** 18n;
    const rem = b % 10n ** 18n;
    const decimals = rem.toString().padStart(18, "0").slice(0, 4);
    return `${whole}.${decimals} GEN`;
  } catch {
    return "0.0000 GEN";
  }
}

export function parseGenToWei(genStr: string): bigint {
  const clean = genStr.trim();
  if (!clean || isNaN(Number(clean))) return 0n;
  const parts = clean.split(".");
  const whole = BigInt(parts[0] || "0") * 10n ** 18n;
  let fraction = 0n;
  if (parts[1]) {
    const padded = parts[1].slice(0, 18).padEnd(18, "0");
    fraction = BigInt(padded);
  }
  return whole + fraction;
}

export function validatePublicHttpsUrl(url: string): { valid: boolean; error?: string } {
  const clean = url.trim();
  if (!clean) return { valid: false, error: "URL cannot be empty" };
  if (!clean.startsWith("https://")) {
    return { valid: false, error: "Only public HTTPS URLs are permitted" };
  }
  if (clean.length > 2048) {
    return { valid: false, error: "URL exceeds maximum length of 2048" };
  }
  if (/[\s\r\n\t]/.test(clean)) {
    return { valid: false, error: "URL contains whitespace" };
  }

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return { valid: false, error: "Local/internal network URLs are prohibited" };
    }

    if (
      host === "127.0.0.1" ||
      host === "169.254.169.254" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return { valid: false, error: "Private and cloud metadata IPs are prohibited" };
    }

    if (parsed.port && parsed.port !== "443") {
      return { valid: false, error: "Non-standard ports are prohibited" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Malformed URL" };
  }
}

export function formatDate(timestampSec: number): string {
  if (!timestampSec || timestampSec <= 0) return "N/A";
  const d = new Date(timestampSec * 1000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRemaining(deadlineSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadlineSec - now;
  if (remaining <= 0) return "Expired";
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m ${seconds}s remaining`;
}
