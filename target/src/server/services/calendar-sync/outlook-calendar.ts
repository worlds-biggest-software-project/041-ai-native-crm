/**
 * Outlook Calendar sync service – fetches calendar events via the Microsoft
 * Graph API and maps attendees to CRM contacts.
 *
 * Covers task T098.
 */

import type { EmailAddress } from "../email-sync/parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  activitiesCreated: number;
  contactsCreated: number;
  errors: string[];
}

interface GraphCalendarAttendee {
  emailAddress: {
    name: string;
    address: string;
  };
  status?: {
    response: string;
    time: string;
  };
  type?: string;
}

interface GraphCalendarEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  body?: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: GraphCalendarAttendee[];
  organizer?: {
    emailAddress: { name: string; address: string };
  };
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  location?: { displayName?: string };
  seriesMasterId?: string;
  webLink?: string;
  isCancelled?: boolean;
}

interface GraphCalendarListResponse {
  value: GraphCalendarEvent[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

export interface CalendarActivity {
  activityType: "meeting";
  subject: string;
  occurredAt: Date;
  endedAt: Date | null;
  detail: {
    event_id: string;
    description: string;
    location: string;
    organizer: EmailAddress | null;
    attendees: EmailAddress[];
    attendee_responses: Record<string, string>;
    web_link: string;
    is_recurring: boolean;
    is_online_meeting: boolean;
    online_meeting_url: string;
    provider: "outlook";
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GRAPH_BASE = "https://graph.microsoft.com/v1.0/me";

function eventToActivity(event: GraphCalendarEvent): CalendarActivity {
  const attendees = event.attendees ?? [];
  const attendeeResponses: Record<string, string> = {};
  for (const a of attendees) {
    attendeeResponses[a.emailAddress.address] = a.status?.response ?? "none";
  }

  return {
    activityType: "meeting",
    subject: event.subject ?? "(No title)",
    occurredAt: new Date(event.start.dateTime),
    endedAt: event.end.dateTime ? new Date(event.end.dateTime) : null,
    detail: {
      event_id: event.id,
      description: event.bodyPreview ?? "",
      location: event.location?.displayName ?? "",
      organizer: event.organizer
        ? {
            email: event.organizer.emailAddress.address,
            name: event.organizer.emailAddress.name,
          }
        : null,
      attendees: attendees.map((a) => ({
        email: a.emailAddress.address,
        name: a.emailAddress.name,
      })),
      attendee_responses: attendeeResponses,
      web_link: event.webLink ?? "",
      is_recurring: !!event.seriesMasterId,
      is_online_meeting: event.isOnlineMeeting ?? false,
      online_meeting_url: event.onlineMeetingUrl ?? "",
      provider: "outlook",
    },
  };
}

// ---------------------------------------------------------------------------
// OutlookCalendarSyncService
// ---------------------------------------------------------------------------

export class OutlookCalendarSyncService {
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
      throw new Error(`Graph Calendar API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Sync calendar events. Fetches events from the past 30 days and
   * upcoming events.
   */
  async syncEvents(options: { maxEvents?: number } = {}): Promise<SyncResult> {
    const maxEvents = options.maxEvents ?? 500;
    const result: SyncResult = {
      activitiesCreated: 0,
      contactsCreated: 0,
      errors: [],
    };
    const allContacts: EmailAddress[] = [];

    try {
      const timeMin = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      let nextLink: string | undefined;
      let fetched = 0;

      // Initial URL with filters
      const initialUrl =
        `${GRAPH_BASE}/events` +
        `?$filter=start/dateTime ge '${timeMin}'` +
        `&$top=${Math.min(100, maxEvents)}` +
        `&$orderby=start/dateTime`;

      do {
        const url = nextLink ?? initialUrl;
        const response = await this.graphFetch<GraphCalendarListResponse>(url);

        for (const event of response.value) {
          try {
            if (event.isCancelled) continue;

            const _activity = eventToActivity(event);
            // TODO: persist activity via database layer
            result.activitiesCreated++;

            // Collect attendee contacts
            const contacts = this.mapAttendeesToContacts(event.attendees ?? []);
            allContacts.push(...contacts);
          } catch (err) {
            result.errors.push(
              `Failed to process event ${event.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        fetched += response.value.length;
        nextLink = response["@odata.nextLink"];
      } while (nextLink && fetched < maxEvents);

      // Deduplicate contacts
      const seen = new Set<string>();
      const uniqueContacts: EmailAddress[] = [];
      for (const contact of allContacts) {
        const key = contact.email.toLowerCase();
        if (key === this.userId.toLowerCase()) continue;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueContacts.push(contact);
        }
      }

      // TODO: persist contacts via database layer
      result.contactsCreated = uniqueContacts.length;
    } catch (err) {
      result.errors.push(
        `Calendar sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return result;
  }

  /**
   * Perform an incremental sync using the delta link from a previous sync.
   */
  async incrementalSync(deltaLink: string): Promise<SyncResult> {
    const result: SyncResult = {
      activitiesCreated: 0,
      contactsCreated: 0,
      errors: [],
    };
    const allContacts: EmailAddress[] = [];

    try {
      let nextLink: string | undefined = deltaLink;

      do {
        const response: GraphCalendarListResponse =
          await this.graphFetch<GraphCalendarListResponse>(nextLink);

        for (const event of response.value) {
          try {
            if (event.isCancelled) continue;

            const _activity = eventToActivity(event);
            // TODO: persist activity via database layer
            result.activitiesCreated++;

            const contacts = this.mapAttendeesToContacts(event.attendees ?? []);
            allContacts.push(...contacts);
          } catch (err) {
            result.errors.push(
              `Failed to process event ${event.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        nextLink = response["@odata.nextLink"];
        // TODO: persist the new deltaLink for next incremental sync:
        // response["@odata.deltaLink"]
      } while (nextLink);

      // Deduplicate contacts
      const seen = new Set<string>();
      const uniqueContacts: EmailAddress[] = [];
      for (const contact of allContacts) {
        const key = contact.email.toLowerCase();
        if (key === this.userId.toLowerCase()) continue;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueContacts.push(contact);
        }
      }

      // TODO: persist contacts via database layer
      result.contactsCreated = uniqueContacts.length;
    } catch (err) {
      result.errors.push(
        `Incremental sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return result;
  }

  /**
   * Register a Microsoft Graph change notification subscription for
   * calendar events.
   */
  async registerChangeNotifications(
    webhookUrl: string,
  ): Promise<{ subscriptionId: string; expiration: string }> {
    // Graph calendar subscriptions can last up to 3 days
    const expirationDateTime = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        changeType: "created,updated,deleted",
        notificationUrl: webhookUrl,
        resource: "me/events",
        expirationDateTime,
        clientState: `crm-cal-${this.workspaceId}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Graph calendar subscription creation failed ${res.status}: ${text}`,
      );
    }

    const data = (await res.json()) as {
      id: string;
      expirationDateTime: string;
    };
    return {
      subscriptionId: data.id,
      expiration: data.expirationDateTime,
    };
  }

  /**
   * Map Microsoft Graph calendar attendees to CRM-style {@link EmailAddress}
   * records.
   */
  mapAttendeesToContacts(attendees: GraphCalendarAttendee[]): EmailAddress[] {
    return attendees.map((a) => ({
      email: a.emailAddress.address,
      name: a.emailAddress.name,
    }));
  }
}
