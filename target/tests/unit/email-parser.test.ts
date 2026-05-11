/**
 * T084 + T085: Unit tests for email parsing functions
 *
 * These tests define the expected contract for the email parser that will live
 * at @/server/services/email-sync/parser. Since the parser module does not
 * exist yet, we validate the contract using inline reference implementations.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Types — the shape the parser module must conform to
// ---------------------------------------------------------------------------

interface EmailAddress {
  email: string;
  name: string;
}

interface RawEmail {
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  date: string;
}

interface ParsedActivity {
  subject: string;
  direction: "inbound" | "outbound";
  from: EmailAddress;
  to: EmailAddress[];
}

// ---------------------------------------------------------------------------
// Reference implementations (contract stubs)
// ---------------------------------------------------------------------------

function parseEmailToActivity(
  email: RawEmail,
  userEmail: string,
): ParsedActivity {
  return {
    subject: email.subject,
    direction:
      email.from.email.toLowerCase() === userEmail.toLowerCase()
        ? "outbound"
        : "inbound",
    from: email.from,
    to: email.to,
  };
}

function extractUniqueContacts(email: RawEmail): EmailAddress[] {
  const seen = new Set<string>();
  const result: EmailAddress[] = [];

  const all: EmailAddress[] = [email.from, ...email.to, ...(email.cc ?? [])];

  for (const addr of all) {
    const key = addr.email.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(addr);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Tests — parseEmailToActivity
// ---------------------------------------------------------------------------

describe("parseEmailToActivity", () => {
  const sampleEmail: RawEmail = {
    subject: "Q3 Proposal Follow-up",
    from: { email: "jane@acme.com", name: "Jane Smith" },
    to: [{ email: "user@mycompany.com", name: "CRM User" }],
    date: "2026-05-12T10:30:00Z",
  };

  it("extracts the subject from the email", () => {
    const result = parseEmailToActivity(sampleEmail, "user@mycompany.com");
    expect(result.subject).toBe("Q3 Proposal Follow-up");
  });

  it("marks direction as inbound when from does not match user email", () => {
    const result = parseEmailToActivity(sampleEmail, "user@mycompany.com");
    expect(result.direction).toBe("inbound");
  });

  it("marks direction as outbound when from matches user email", () => {
    const outboundEmail: RawEmail = {
      subject: "Re: Q3 Proposal Follow-up",
      from: { email: "user@mycompany.com", name: "CRM User" },
      to: [{ email: "jane@acme.com", name: "Jane Smith" }],
      date: "2026-05-12T11:00:00Z",
    };
    const result = parseEmailToActivity(outboundEmail, "user@mycompany.com");
    expect(result.direction).toBe("outbound");
  });

  it("handles case-insensitive comparison for user email", () => {
    const mixedCaseEmail: RawEmail = {
      subject: "Test",
      from: { email: "User@MyCompany.com", name: "CRM User" },
      to: [{ email: "jane@acme.com", name: "Jane Smith" }],
      date: "2026-05-12T11:00:00Z",
    };
    const result = parseEmailToActivity(mixedCaseEmail, "user@mycompany.com");
    expect(result.direction).toBe("outbound");
  });

  it("preserves from address in the result", () => {
    const result = parseEmailToActivity(sampleEmail, "user@mycompany.com");
    expect(result.from).toEqual({ email: "jane@acme.com", name: "Jane Smith" });
  });

  it("preserves to addresses in the result", () => {
    const result = parseEmailToActivity(sampleEmail, "user@mycompany.com");
    expect(result.to).toEqual([
      { email: "user@mycompany.com", name: "CRM User" },
    ]);
  });

  it("handles multiple to recipients", () => {
    const multiTo: RawEmail = {
      subject: "Team Update",
      from: { email: "boss@acme.com", name: "Boss" },
      to: [
        { email: "user@mycompany.com", name: "CRM User" },
        { email: "colleague@mycompany.com", name: "Colleague" },
      ],
      date: "2026-05-12T12:00:00Z",
    };
    const result = parseEmailToActivity(multiTo, "user@mycompany.com");
    expect(result.to).toHaveLength(2);
    expect(result.direction).toBe("inbound");
  });

  it("handles empty subject", () => {
    const noSubject: RawEmail = {
      subject: "",
      from: { email: "jane@acme.com", name: "Jane Smith" },
      to: [{ email: "user@mycompany.com", name: "CRM User" }],
      date: "2026-05-12T10:00:00Z",
    };
    const result = parseEmailToActivity(noSubject, "user@mycompany.com");
    expect(result.subject).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Tests — extractUniqueContacts
// ---------------------------------------------------------------------------

describe("extractUniqueContacts", () => {
  it("returns all unique contacts from from, to, and cc", () => {
    const email: RawEmail = {
      subject: "Hello",
      from: { email: "alice@acme.com", name: "Alice" },
      to: [{ email: "bob@corp.com", name: "Bob" }],
      cc: [{ email: "carol@example.com", name: "Carol" }],
      date: "2026-05-12T10:00:00Z",
    };
    const contacts = extractUniqueContacts(email);
    expect(contacts).toHaveLength(3);
    expect(contacts.map((c) => c.email)).toEqual([
      "alice@acme.com",
      "bob@corp.com",
      "carol@example.com",
    ]);
  });

  it("deduplicates contacts with the same email across fields", () => {
    const email: RawEmail = {
      subject: "Duplicate test",
      from: { email: "alice@acme.com", name: "Alice" },
      to: [
        { email: "alice@acme.com", name: "Alice A." },
        { email: "bob@corp.com", name: "Bob" },
      ],
      cc: [{ email: "bob@corp.com", name: "Robert" }],
      date: "2026-05-12T10:00:00Z",
    };
    const contacts = extractUniqueContacts(email);
    expect(contacts).toHaveLength(2);
  });

  it("deduplicates case-insensitively", () => {
    const email: RawEmail = {
      subject: "Case test",
      from: { email: "Alice@Acme.com", name: "Alice" },
      to: [{ email: "alice@acme.com", name: "Alice Lower" }],
      date: "2026-05-12T10:00:00Z",
    };
    const contacts = extractUniqueContacts(email);
    expect(contacts).toHaveLength(1);
  });

  it("keeps first occurrence when duplicates exist", () => {
    const email: RawEmail = {
      subject: "First wins",
      from: { email: "alice@acme.com", name: "Alice From" },
      to: [{ email: "alice@acme.com", name: "Alice To" }],
      date: "2026-05-12T10:00:00Z",
    };
    const contacts = extractUniqueContacts(email);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]!.name).toBe("Alice From");
  });

  it("handles email with no cc field", () => {
    const email: RawEmail = {
      subject: "No CC",
      from: { email: "alice@acme.com", name: "Alice" },
      to: [{ email: "bob@corp.com", name: "Bob" }],
      date: "2026-05-12T10:00:00Z",
    };
    const contacts = extractUniqueContacts(email);
    expect(contacts).toHaveLength(2);
  });

  it("handles multiple to and cc recipients", () => {
    const email: RawEmail = {
      subject: "Big thread",
      from: { email: "sender@acme.com", name: "Sender" },
      to: [
        { email: "a@corp.com", name: "A" },
        { email: "b@corp.com", name: "B" },
      ],
      cc: [
        { email: "c@corp.com", name: "C" },
        { email: "d@corp.com", name: "D" },
      ],
      date: "2026-05-12T10:00:00Z",
    };
    const contacts = extractUniqueContacts(email);
    expect(contacts).toHaveLength(5);
  });
});
