/**
 * Email parser – converts raw provider emails into CRM activity records
 * and extracts contact information.
 *
 * Covers tasks T093 (parse email to activity / extract contacts) and
 * T096 (internal-email filtering via excluded domains).
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface EmailAddress {
  email: string;
  name: string;
}

export interface RawEmail {
  messageId: string;
  threadId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  date: string;
  bodyText: string;
  hasAttachments: boolean;
  attachmentNames?: string[];
  provider: "gmail" | "outlook";
}

export interface ParsedActivity {
  activityType: "email";
  subject: string;
  occurredAt: Date;
  detail: {
    message_id: string;
    thread_id: string;
    direction: "inbound" | "outbound";
    from: EmailAddress;
    to: EmailAddress[];
    cc: EmailAddress[];
    body_text: string;
    has_attachments: boolean;
    attachment_names: string[];
    provider: "gmail" | "outlook";
  };
}

// ---------------------------------------------------------------------------
// parseEmailToActivity
// ---------------------------------------------------------------------------

/**
 * Convert a {@link RawEmail} into a {@link ParsedActivity} suitable for
 * persisting as a CRM timeline entry.
 *
 * Direction is determined by comparing the sender address against the
 * authenticated user's email (case-insensitive).
 */
export function parseEmailToActivity(
  email: RawEmail,
  userEmail: string,
): ParsedActivity {
  const direction: "inbound" | "outbound" =
    email.from.email.toLowerCase() === userEmail.toLowerCase()
      ? "outbound"
      : "inbound";

  return {
    activityType: "email",
    subject: email.subject,
    occurredAt: new Date(email.date),
    detail: {
      message_id: email.messageId,
      thread_id: email.threadId,
      direction,
      from: email.from,
      to: email.to,
      cc: email.cc ?? [],
      body_text: email.bodyText,
      has_attachments: email.hasAttachments,
      attachment_names: email.attachmentNames ?? [],
      provider: email.provider,
    },
  };
}

// ---------------------------------------------------------------------------
// extractUniqueContacts
// ---------------------------------------------------------------------------

/**
 * Collect every address that appears in the from / to / cc fields of the
 * supplied emails and return a de-duplicated list.
 *
 * De-duplication is based on the lower-cased email address. When the same
 * address appears with different display names the first occurrence wins.
 *
 * The optional `excludeEmail` parameter (typically the authenticated user)
 * is stripped from the result set.
 */
export function extractUniqueContacts(
  emails: RawEmail[],
  excludeEmail?: string,
): EmailAddress[] {
  const seen = new Map<string, EmailAddress>();
  const excludeKey = excludeEmail?.toLowerCase();

  for (const email of emails) {
    const addresses: EmailAddress[] = [
      email.from,
      ...email.to,
      ...(email.cc ?? []),
    ];

    for (const addr of addresses) {
      const key = addr.email.toLowerCase();
      if (key === excludeKey) continue;
      if (!seen.has(key)) {
        seen.set(key, addr);
      }
    }
  }

  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// isFromUs  (T096 – internal email filter)
// ---------------------------------------------------------------------------

/**
 * Return `true` when **all** participants (from + to + cc) belong to one of
 * the workspace's excluded domains, meaning the email is purely internal and
 * should be skipped during sync.
 *
 * Domain comparison is case-insensitive.
 */
export function isFromUs(email: RawEmail, excludedDomains: string[]): boolean {
  const domains = new Set(excludedDomains.map((d) => d.toLowerCase()));

  const allAddresses: EmailAddress[] = [
    email.from,
    ...email.to,
    ...(email.cc ?? []),
  ];

  return allAddresses.every((addr) => {
    const domain = addr.email.toLowerCase().split("@")[1];
    return domain !== undefined && domains.has(domain);
  });
}
