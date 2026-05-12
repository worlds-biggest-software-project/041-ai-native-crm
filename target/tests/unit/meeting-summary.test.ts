/**
 * T120 + T121: Unit tests for meeting summary prompt building and response parsing.
 */

import { describe, it, expect } from "vitest";
import {
  buildMeetingContext,
  parseMeetingSummaryResponse,
  type MeetingContext,
} from "@/server/services/ai/prompts";

// ---------------------------------------------------------------------------
// T120: Tests for buildMeetingContext
// ---------------------------------------------------------------------------

describe("buildMeetingContext", () => {
  const baseMeeting: MeetingContext = {
    subject: "Q4 Planning Review",
    occurredAt: new Date("2026-05-12T14:00:00Z"),
    attendees: [
      { name: "Alice Johnson", email: "alice@acme.com" },
      { name: "Bob Smith", email: "bob@acme.com" },
    ],
  };

  it("includes meeting subject and date", () => {
    const result = buildMeetingContext(baseMeeting);
    expect(result).toContain("Subject: Q4 Planning Review");
    expect(result).toContain("Date: 2026-05-12T14:00:00.000Z");
  });

  it("includes attendee names and emails", () => {
    const result = buildMeetingContext(baseMeeting);
    expect(result).toContain("- Alice Johnson <alice@acme.com>");
    expect(result).toContain("- Bob Smith <bob@acme.com>");
  });

  it("includes deal context when provided", () => {
    const meeting: MeetingContext = {
      ...baseMeeting,
      dealName: "Enterprise License",
      dealStage: "Negotiation",
      dealAmount: 50000,
    };
    const result = buildMeetingContext(meeting);
    expect(result).toContain("## Deal Context");
    expect(result).toContain("Deal Name: Enterprise License");
    expect(result).toContain("Stage: Negotiation");
    expect(result).toContain("Amount: $50,000");
  });

  it("includes recent emails when provided", () => {
    const meeting: MeetingContext = {
      ...baseMeeting,
      recentEmails: [
        {
          subject: "Re: Contract Terms",
          from: "alice@acme.com",
          bodyPreview: "I have reviewed the terms and have a few questions...",
        },
      ],
    };
    const result = buildMeetingContext(meeting);
    expect(result).toContain("## Recent Email Threads");
    expect(result).toContain("Subject: Re: Contract Terms");
    expect(result).toContain("From: alice@acme.com");
    expect(result).toContain(
      "Preview: I have reviewed the terms and have a few questions...",
    );
  });

  it("handles missing optional fields", () => {
    const minimal: MeetingContext = {
      subject: "Quick Sync",
      occurredAt: new Date("2026-05-12T10:00:00Z"),
      attendees: [],
    };
    const result = buildMeetingContext(minimal);
    expect(result).toContain("Subject: Quick Sync");
    expect(result).not.toContain("## Deal Context");
    expect(result).not.toContain("## Recent Email Threads");
  });
});

// ---------------------------------------------------------------------------
// T121: Tests for parseMeetingSummaryResponse
// ---------------------------------------------------------------------------

describe("parseMeetingSummaryResponse", () => {
  it("parses valid JSON response into MeetingSummaryOutput", () => {
    const raw = JSON.stringify({
      summary: "Discussed Q4 targets and budget allocation.",
      key_points: ["Revenue target set at $2M", "Marketing budget approved"],
      action_items: [
        {
          description: "Send revised proposal",
          assignee: "Alice",
          due_date: "2026-05-20",
        },
      ],
      sentiment: "positive",
      topics: ["budget", "revenue"],
    });

    const result = parseMeetingSummaryResponse(raw);
    expect(result.summary).toBe("Discussed Q4 targets and budget allocation.");
    expect(result.sentiment).toBe("positive");
    expect(result.topics).toEqual(["budget", "revenue"]);
  });

  it("extracts key_points array", () => {
    const raw = JSON.stringify({
      summary: "Test",
      key_points: ["Point A", "Point B", "Point C"],
      action_items: [],
      sentiment: "neutral",
      topics: [],
    });

    const result = parseMeetingSummaryResponse(raw);
    expect(result.key_points).toHaveLength(3);
    expect(result.key_points).toEqual(["Point A", "Point B", "Point C"]);
  });

  it("extracts action_items with assignee and due_date", () => {
    const raw = JSON.stringify({
      summary: "Test",
      key_points: [],
      action_items: [
        {
          description: "Prepare presentation",
          assignee: "Bob",
          due_date: "2026-06-01",
        },
        {
          description: "Review contract",
        },
      ],
      sentiment: "neutral",
      topics: [],
    });

    const result = parseMeetingSummaryResponse(raw);
    expect(result.action_items).toHaveLength(2);
    expect(result.action_items[0]!.description).toBe("Prepare presentation");
    expect(result.action_items[0]!.assignee).toBe("Bob");
    expect(result.action_items[0]!.due_date).toBe("2026-06-01");
    expect(result.action_items[1]!.description).toBe("Review contract");
    expect(result.action_items[1]!.assignee).toBeUndefined();
    expect(result.action_items[1]!.due_date).toBeUndefined();
  });

  it("handles missing optional fields with defaults", () => {
    const raw = JSON.stringify({
      summary: "Minimal meeting.",
    });

    const result = parseMeetingSummaryResponse(raw);
    expect(result.summary).toBe("Minimal meeting.");
    expect(result.key_points).toEqual([]);
    expect(result.action_items).toEqual([]);
    expect(result.sentiment).toBe("neutral");
    expect(result.topics).toEqual([]);
  });
});
