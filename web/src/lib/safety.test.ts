import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  formatAddress,
  formatGen,
  formatCompactGen,
  formatCommaGen,
  parseGenToWei,
  validatePublicHttpsUrl,
  formatTimeRemaining,
} from "./safety";

describe("safety utilities", () => {
  it("sanitizes text properly", () => {
    expect(sanitizeText("   hello world   ")).toBe("hello world");
    expect(sanitizeText("a".repeat(20000), 100)).toHaveLength(100);
  });

  it("formats ethereum addresses", () => {
    expect(formatAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234...5678"
    );
    expect(formatAddress("")).toBe("0x000...0000");
  });

  it("formats GEN balances from wei", () => {
    expect(formatGen(10n ** 18n)).toBe("1.0000 GEN");
    expect(formatGen(50000000000000000n)).toBe("0.0500 GEN");
    expect(formatGen(0n)).toBe("0.0000 GEN");
  });

  it("formats compact GEN balances cleanly", () => {
    expect(formatCompactGen("0.0500 GEN")).toBe("0.05 GEN");
    expect(formatCompactGen("1250.5000 GEN")).toBe("1.25k GEN");
    expect(formatCompactGen("2500000.0000 GEN")).toBe("2.50M GEN");
    expect(formatCompactGen("10000000199979660.9000 GEN")).toBe("10.00P GEN");
  });

  it("formats comma-separated detailed GEN balances", () => {
    expect(formatCommaGen("10000000199979660.9000 GEN")).toBe("10,000,000,199,979,660.9000 GEN");
    expect(formatCommaGen("1250.5000 GEN")).toBe("1,250.5000 GEN");
  });


  it("parses GEN to wei correctly", () => {
    expect(parseGenToWei("1.0")).toBe(10n ** 18n);
    expect(parseGenToWei("0.05")).toBe(50000000000000000n);
    expect(parseGenToWei("")).toBe(0n);
  });

  it("validates public HTTPS URLs and catches SSRF vectors", () => {
    expect(validatePublicHttpsUrl("https://cdn.example.com/data.json").valid).toBe(true);
    expect(validatePublicHttpsUrl("http://insecure.com").valid).toBe(false);
    expect(validatePublicHttpsUrl("https://localhost/admin").valid).toBe(false);
    expect(validatePublicHttpsUrl("https://127.0.0.1:8080").valid).toBe(false);
    expect(validatePublicHttpsUrl("https://169.254.169.254/latest").valid).toBe(false);
    expect(validatePublicHttpsUrl("https://10.0.0.1/intranet").valid).toBe(false);
    expect(validatePublicHttpsUrl("https://192.168.1.1").valid).toBe(false);
    expect(validatePublicHttpsUrl("https://example.com:8443").valid).toBe(false);
  });

  it("formats time remaining appropriately", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeRemaining(now - 10)).toBe("Expired");
    expect(formatTimeRemaining(now + 120)).toContain("m");
  });
});
