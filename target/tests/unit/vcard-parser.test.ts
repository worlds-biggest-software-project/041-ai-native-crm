import { describe, it, expect } from "vitest";
import {
  parseVCard,
  parseVCardSingle,
} from "@/server/services/import/vcard-parser";

describe("vCard parser", () => {
  it("parses FN into fullName", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results).toHaveLength(1);
    expect(results[0]!.fullName).toBe("John Doe");
  });

  it("parses N into firstName and lastName", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
N:Smith;Jane;;;
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results).toHaveLength(1);
    expect(results[0]!.firstName).toBe("Jane");
    expect(results[0]!.lastName).toBe("Smith");
  });

  it("parses EMAIL into email", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL:john@example.com
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results[0]!.email).toBe("john@example.com");
  });

  it("parses ORG into companyName", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
ORG:Acme Corp;Engineering
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results[0]!.companyName).toBe("Acme Corp");
  });

  it("handles multiple vCards in one file", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Alice Johnson
EMAIL:alice@example.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Bob Smith
EMAIL:bob@example.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Carol Davis
EMAIL:carol@example.com
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results).toHaveLength(3);
    expect(results[0]!.fullName).toBe("Alice Johnson");
    expect(results[1]!.fullName).toBe("Bob Smith");
    expect(results[2]!.fullName).toBe("Carol Davis");
  });

  it("handles line folding", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
NOTE:This is a very long note that has been
 folded across multiple lines for
 formatting purposes.
EMAIL:john@example.com
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results).toHaveLength(1);
    expect(results[0]!.email).toBe("john@example.com");
  });

  it("returns empty array for empty input", () => {
    expect(parseVCard("")).toEqual([]);
    expect(parseVCard("  \n  ")).toEqual([]);
  });

  it("parses TEL into phone", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL;TYPE=WORK:+1-555-1234
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results[0]!.phone).toBe("+1-555-1234");
  });

  it("parses TITLE into title", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TITLE:VP of Engineering
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results[0]!.title).toBe("VP of Engineering");
  });

  it("parses ADR into address", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
ADR:;;123 Main St;Springfield;IL;62704;US
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results[0]!.address).toBeDefined();
    expect(results[0]!.address).toContain("123 Main St");
  });

  it("parseVCardSingle works on a single block", () => {
    const block = `FN:Direct Parse
EMAIL:direct@example.com
ORG:Direct Corp`;

    const result = parseVCardSingle(block);
    expect(result.fullName).toBe("Direct Parse");
    expect(result.email).toBe("direct@example.com");
    expect(result.companyName).toBe("Direct Corp");
  });

  it("handles EMAIL with TYPE parameter", () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL;TYPE=WORK:john.work@example.com
END:VCARD`;

    const results = parseVCard(vcard);
    expect(results[0]!.email).toBe("john.work@example.com");
  });
});
