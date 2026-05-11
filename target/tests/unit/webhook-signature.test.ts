/**
 * T165: Unit tests for webhook HMAC-SHA256 signature generation
 *
 * Tests the signPayload function from @/server/services/webhook-dispatch.
 */

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { signPayload } from "@/server/services/webhook-dispatch";

describe("signPayload", () => {
  it("computes HMAC-SHA256 correctly for a known payload", () => {
    const payload = '{"event":"contact.created","data":{}}';
    const secret = "test-secret-key";

    const result = signPayload(payload, secret);

    // Compute expected value independently
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    expect(result).toBe(expected);
    // Verify it's a valid 64-character hex string (SHA-256 output)
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different signatures for different secrets", () => {
    const payload = '{"event":"deal.created","data":{"id":"123"}}';
    const secret1 = "secret-alpha";
    const secret2 = "secret-beta";

    const sig1 = signPayload(payload, secret1);
    const sig2 = signPayload(payload, secret2);

    expect(sig1).not.toBe(sig2);
  });

  it("produces different signatures for different payloads", () => {
    const secret = "shared-secret";
    const payload1 = '{"event":"contact.created"}';
    const payload2 = '{"event":"contact.deleted"}';

    const sig1 = signPayload(payload1, secret);
    const sig2 = signPayload(payload2, secret);

    expect(sig1).not.toBe(sig2);
  });

  it("produces consistent signature for same input", () => {
    const payload = '{"event":"task.completed","data":{"taskId":"abc"}}';
    const secret = "deterministic-secret";

    const sig1 = signPayload(payload, secret);
    const sig2 = signPayload(payload, secret);

    expect(sig1).toBe(sig2);
  });
});
