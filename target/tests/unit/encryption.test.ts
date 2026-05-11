/**
 * T086: Unit tests for AES-256-GCM encryption utilities
 *
 * Tests the encrypt/decrypt round-trip, ciphertext uniqueness, and
 * key validation from @/server/lib/encryption.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encrypt, decrypt } from "@/server/lib/encryption";

// ---------------------------------------------------------------------------
// Environment setup — provide a deterministic 32-byte key (64 hex chars)
// ---------------------------------------------------------------------------

const TEST_KEY = "0".repeat(64);
let originalKey: string | undefined;

beforeAll(() => {
  originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

afterAll(() => {
  if (originalKey === undefined) {
    delete process.env.ENCRYPTION_KEY;
  } else {
    process.env.ENCRYPTION_KEY = originalKey;
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("encrypt / decrypt round-trip", () => {
  it("returns the original plaintext after encrypt then decrypt", () => {
    const plaintext = "my-secret-oauth-token-12345";
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("handles empty string", () => {
    const plaintext = "";
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("handles unicode content", () => {
    const plaintext = "token-with-unicode-éèê-\u{1F680}";
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("handles long strings", () => {
    const plaintext = "a]".repeat(5000);
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });
});

describe("ciphertext properties", () => {
  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const plaintext = "same-input-different-output";
    const ct1 = encrypt(plaintext);
    const ct2 = encrypt(plaintext);
    expect(ct1).not.toBe(ct2);
  });

  it("produces different ciphertexts for different plaintexts", () => {
    const ct1 = encrypt("input-alpha");
    const ct2 = encrypt("input-beta");
    expect(ct1).not.toBe(ct2);
  });

  it("ciphertext is a base64-encoded string", () => {
    const ciphertext = encrypt("test-value");
    expect(() => Buffer.from(ciphertext, "base64")).not.toThrow();
    // Re-encoding should match (valid base64 roundtrips cleanly)
    const buf = Buffer.from(ciphertext, "base64");
    expect(buf.toString("base64")).toBe(ciphertext);
  });
});

describe("wrong key rejection", () => {
  it("throws when decrypting with a different key", () => {
    // Encrypt with the test key
    const ciphertext = encrypt("sensitive-data");

    // Swap to a different key
    process.env.ENCRYPTION_KEY = "f".repeat(64);

    expect(() => decrypt(ciphertext)).toThrow();

    // Restore the test key for subsequent tests
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });
});

describe("key validation", () => {
  it("throws when ENCRYPTION_KEY is missing", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;

    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");

    process.env.ENCRYPTION_KEY = saved;
  });

  it("throws when ENCRYPTION_KEY is too short", () => {
    const saved = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "abcd";

    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");

    process.env.ENCRYPTION_KEY = saved;
  });
});
