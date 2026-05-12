/**
 * Gmail sync service – fetches emails from the Gmail API and converts them
 * into CRM activities via the email parser.
 *
 * Covers task T094.
 */

import {
  type RawEmail,
  type EmailAddress,
  parseEmailToActivity,
  extractUniqueContacts,
  isFromUs,
} from "./parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  activitiesCreated: number;
  contactsCreated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Gmail API response shapes (minimal subset we care about)
// ---------------------------------------------------------------------------

interface GmailThread {
  id: string;
  historyId: string;
}

interface GmailThreadListResponse {
  threads?: GmailThread[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailMessagePart {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  payload?: {
    headers?: { name: string; value: string }[];
    mimeType?: string;
    parts?: GmailMessagePart[];
    body?: { data?: string; size?: number };
  };
  internalDate?: string;
}

interface GmailHistoryRecord {
  id: string;
  messagesAdded?: { message: GmailMessage }[];
}

interface GmailHistoryListResponse {
  history?: GmailHistoryRecord[];
  historyId?: string;
  nextPageToken?: string;
}

interface GmailWatchResponse {
  historyId: string;
  expiration: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

function getHeader(
  headers: { name: string; value: string }[] | undefined,
  name: string,
): string {
  return (
    headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function parseAddressList(raw: string): EmailAddress[] {
  if (!raw) return [];

  // Handles formats like:  "Jane Doe <jane@example.com>, bob@example.com"
  return raw.split(",").map((entry) => {
    const trimmed = entry.trim();
    const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return {
        name: (match[1] ?? "").trim().replace(/^"|"$/g, ""),
        email: (match[2] ?? "").trim(),
      };
    }
    return { name: "", email: trimmed };
  });
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractTextBody(payload: GmailMessage["payload"]): string {
  if (!payload) return "";

  // Prefer text/plain, fall back to first available part.
  const find = (parts: GmailMessagePart[] | undefined): string => {
    if (!parts) return "";
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        const nested = find(part.parts);
        if (nested) return nested;
      }
    }
    return "";
  };

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  return find(payload.parts);
}

function collectAttachmentNames(payload: GmailMessage["payload"]): string[] {
  const names: string[] = [];
  const walk = (parts: GmailMessagePart[] | undefined) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.filename) names.push(part.filename);
      if (part.parts) walk(part.parts);
    }
  };
  walk(payload?.parts);
  return names;
}

function gmailMessageToRawEmail(msg: GmailMessage): RawEmail {
  const headers = msg.payload?.headers;
  const attachmentNames = collectAttachmentNames(msg.payload);

  return {
    messageId: msg.id,
    threadId: msg.threadId,
    subject: getHeader(headers, "Subject"),
    from: parseAddressList(getHeader(headers, "From"))[0] ?? {
      email: "",
      name: "",
    },
    to: parseAddressList(getHeader(headers, "To")),
    cc: parseAddressList(getHeader(headers, "Cc")) || undefined,
    date: msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : getHeader(headers, "Date"),
    bodyText: extractTextBody(msg.payload),
    hasAttachments: attachmentNames.length > 0,
    attachmentNames: attachmentNames.length > 0 ? attachmentNames : undefined,
    provider: "gmail",
  };
}

// ---------------------------------------------------------------------------
// GmailSyncService
// ---------------------------------------------------------------------------

export class GmailSyncService {
  constructor(
    private accessToken: string,
    private workspaceId: string,
    private userId: string,
  ) {}

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async gmailFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${GMAIL_BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gmail API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * List thread IDs with optional pagination.
   */
  private async listThreads(
    pageToken?: string,
    maxResults = 100,
  ): Promise<GmailThreadListResponse> {
    let path = `/threads?maxResults=${maxResults}`;
    if (pageToken) path += `&pageToken=${pageToken}`;
    return this.gmailFetch<GmailThreadListResponse>(path);
  }

  /**
   * Fetch a single message by ID (full format).
   */
  private async getMessage(messageId: string): Promise<GmailMessage> {
    return this.gmailFetch<GmailMessage>(`/messages/${messageId}?format=full`);
  }

  /**
   * Fetch all messages within a thread.
   */
  private async getThread(
    threadId: string,
  ): Promise<{ messages: GmailMessage[] }> {
    return this.gmailFetch<{ messages: GmailMessage[] }>(
      `/threads/${threadId}?format=full`,
    );
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Perform a full initial sync, fetching up to `maxThreads` threads worth
   * of messages and converting them to CRM activities.
   */
  async initialSync(
    options: { maxThreads?: number } = {},
  ): Promise<SyncResult> {
    const maxThreads = options.maxThreads ?? 200;
    const result: SyncResult = {
      activitiesCreated: 0,
      contactsCreated: 0,
      errors: [],
    };
    const allRawEmails: RawEmail[] = [];

    try {
      let pageToken: string | undefined;
      let threadsFetched = 0;

      // 1. Paginate through thread list
      while (threadsFetched < maxThreads) {
        const batch = Math.min(100, maxThreads - threadsFetched);
        const listing = await this.listThreads(pageToken, batch);

        if (!listing.threads || listing.threads.length === 0) break;

        // 2. Fetch each thread's messages
        for (const thread of listing.threads) {
          try {
            const threadDetail = await this.getThread(thread.id);
            for (const msg of threadDetail.messages) {
              const raw = gmailMessageToRawEmail(msg);
              allRawEmails.push(raw);
            }
          } catch (err) {
            result.errors.push(
              `Failed to fetch thread ${thread.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        threadsFetched += listing.threads.length;
        pageToken = listing.nextPageToken;
        if (!pageToken) break;
      }

      // 3. Convert to activities
      for (const raw of allRawEmails) {
        // TODO: persist activity via database layer
        const _activity = parseEmailToActivity(raw, this.userId);
        result.activitiesCreated++;
      }

      // 4. Extract unique contacts
      const contacts = extractUniqueContacts(allRawEmails, this.userId);
      // TODO: persist contacts via database layer
      result.contactsCreated = contacts.length;
    } catch (err) {
      result.errors.push(
        `Initial sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return result;
  }

  /**
   * Perform an incremental sync using the Gmail history API starting from
   * the given history ID.
   */
  async incrementalSync(historyId: string): Promise<SyncResult> {
    const result: SyncResult = {
      activitiesCreated: 0,
      contactsCreated: 0,
      errors: [],
    };
    const allRawEmails: RawEmail[] = [];

    try {
      let pageToken: string | undefined;

      // 1. Paginate through history records
      do {
        let path = `/history?startHistoryId=${historyId}&historyTypes=messageAdded`;
        if (pageToken) path += `&pageToken=${pageToken}`;

        const historyResponse =
          await this.gmailFetch<GmailHistoryListResponse>(path);

        if (historyResponse.history) {
          for (const record of historyResponse.history) {
            if (!record.messagesAdded) continue;
            for (const added of record.messagesAdded) {
              try {
                // History records contain minimal message data; fetch full message
                const full = await this.getMessage(added.message.id);
                allRawEmails.push(gmailMessageToRawEmail(full));
              } catch (err) {
                result.errors.push(
                  `Failed to fetch message ${added.message.id}: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            }
          }
        }

        pageToken = historyResponse.nextPageToken;
      } while (pageToken);

      // 2. Convert to activities
      for (const raw of allRawEmails) {
        // TODO: persist activity via database layer
        const _activity = parseEmailToActivity(raw, this.userId);
        result.activitiesCreated++;
      }

      // 3. Extract contacts
      const contacts = extractUniqueContacts(allRawEmails, this.userId);
      // TODO: persist contacts via database layer
      result.contactsCreated = contacts.length;
    } catch (err) {
      result.errors.push(
        `Incremental sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return result;
  }

  /**
   * Register a Gmail push notification watch so new messages trigger a
   * webhook callback.
   */
  async registerPushNotifications(
    webhookUrl: string,
  ): Promise<{ historyId: string; expiration: string }> {
    const res = await fetch(`${GMAIL_BASE}/watch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName: webhookUrl, // Cloud Pub/Sub topic
        labelIds: ["INBOX"],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gmail watch registration failed ${res.status}: ${text}`);
    }

    const data = (await res.json()) as GmailWatchResponse;
    return {
      historyId: data.historyId,
      expiration: data.expiration,
    };
  }
}
