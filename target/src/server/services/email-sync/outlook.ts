/**
 * Outlook (Microsoft Graph) email sync service – fetches emails via the
 * Graph API and converts them into CRM activities.
 *
 * Covers task T095.
 */

import {
  type RawEmail,
  type EmailAddress,
  parseEmailToActivity,
  extractUniqueContacts,
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
// Microsoft Graph response shapes (minimal subset)
// ---------------------------------------------------------------------------

interface GraphEmailAddress {
  emailAddress: {
    name: string;
    address: string;
  };
}

interface GraphAttachment {
  name: string;
  contentType: string;
  size: number;
}

interface GraphMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: GraphEmailAddress;
  toRecipients: GraphEmailAddress[];
  ccRecipients?: GraphEmailAddress[];
  receivedDateTime: string;
  body: { contentType: string; content: string };
  hasAttachments: boolean;
  // Populated by a separate call if needed
  attachments?: GraphAttachment[];
}

interface GraphMessageListResponse {
  value: GraphMessage[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

interface GraphSubscriptionResponse {
  id: string;
  expirationDateTime: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GRAPH_BASE = "https://graph.microsoft.com/v1.0/me";

function toEmailAddress(g: GraphEmailAddress): EmailAddress {
  return {
    email: g.emailAddress.address,
    name: g.emailAddress.name,
  };
}

function stripHtml(html: string): string {
  // Lightweight HTML-to-text: strip tags, decode common entities
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function graphMessageToRawEmail(msg: GraphMessage): RawEmail {
  const attachmentNames = (msg.attachments ?? []).map((a) => a.name);
  const bodyText =
    msg.body.contentType === "text"
      ? msg.body.content
      : stripHtml(msg.body.content);

  return {
    messageId: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject,
    from: toEmailAddress(msg.from),
    to: msg.toRecipients.map(toEmailAddress),
    cc: msg.ccRecipients?.map(toEmailAddress) ?? undefined,
    date: msg.receivedDateTime,
    bodyText,
    hasAttachments: msg.hasAttachments,
    attachmentNames: attachmentNames.length > 0 ? attachmentNames : undefined,
    provider: "outlook",
  };
}

// ---------------------------------------------------------------------------
// OutlookSyncService
// ---------------------------------------------------------------------------

export class OutlookSyncService {
  constructor(
    private accessToken: string,
    private workspaceId: string,
    private userId: string,
  ) {}

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async graphFetch<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * List messages, returning a page of results plus optional next/delta links.
   */
  private async listMessages(
    url?: string,
    top = 100,
  ): Promise<GraphMessageListResponse> {
    const endpoint =
      url ?? `${GRAPH_BASE}/messages?$top=${top}&$orderby=receivedDateTime desc`;
    return this.graphFetch<GraphMessageListResponse>(endpoint);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Perform a full initial sync, fetching up to `maxMessages` emails and
   * converting them to CRM activities.
   */
  async initialSync(
    options: { maxMessages?: number } = {},
  ): Promise<SyncResult> {
    const maxMessages = options.maxMessages ?? 500;
    const result: SyncResult = { activitiesCreated: 0, contactsCreated: 0, errors: [] };
    const allRawEmails: RawEmail[] = [];

    try {
      let nextLink: string | undefined;
      let fetched = 0;

      // 1. Paginate through messages
      do {
        const batch = Math.min(100, maxMessages - fetched);
        const response = await this.listMessages(
          nextLink,
          nextLink ? undefined : batch,
        );

        for (const msg of response.value) {
          try {
            allRawEmails.push(graphMessageToRawEmail(msg));
          } catch (err) {
            result.errors.push(
              `Failed to parse message ${msg.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        fetched += response.value.length;
        nextLink = response["@odata.nextLink"];
      } while (nextLink && fetched < maxMessages);

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
        `Initial sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return result;
  }

  /**
   * Perform an incremental sync using the delta link returned by a previous
   * full or incremental sync.
   */
  async incrementalSync(deltaLink: string): Promise<SyncResult> {
    const result: SyncResult = { activitiesCreated: 0, contactsCreated: 0, errors: [] };
    const allRawEmails: RawEmail[] = [];

    try {
      let nextLink: string | undefined = deltaLink;

      // Follow @odata.nextLink until we reach @odata.deltaLink (end of changes)
      do {
        const response: GraphMessageListResponse = await this.graphFetch<GraphMessageListResponse>(nextLink);

        for (const msg of response.value) {
          try {
            allRawEmails.push(graphMessageToRawEmail(msg));
          } catch (err) {
            result.errors.push(
              `Failed to parse message ${msg.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        nextLink = response["@odata.nextLink"];
        // TODO: persist the new deltaLink for next incremental sync:
        // response["@odata.deltaLink"]
      } while (nextLink);

      // Convert to activities
      for (const raw of allRawEmails) {
        // TODO: persist activity via database layer
        const _activity = parseEmailToActivity(raw, this.userId);
        result.activitiesCreated++;
      }

      // Extract contacts
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
   * Create a Microsoft Graph subscription for change notifications on the
   * user's mailbox.
   */
  async registerChangeNotifications(
    webhookUrl: string,
  ): Promise<{ subscriptionId: string; expiration: string }> {
    // Graph subscriptions expire after a maximum of 3 days for messages
    const expirationDateTime = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const res = await fetch(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeType: "created,updated",
          notificationUrl: webhookUrl,
          resource: "me/messages",
          expirationDateTime,
          clientState: `crm-${this.workspaceId}`,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Graph subscription creation failed ${res.status}: ${text}`,
      );
    }

    const data = (await res.json()) as GraphSubscriptionResponse;
    return {
      subscriptionId: data.id,
      expiration: data.expirationDateTime,
    };
  }
}
