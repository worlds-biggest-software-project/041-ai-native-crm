"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EnrichmentChange {
  old: unknown;
  new: unknown;
  confidence: number;
}

interface EnrichmentLogEntry {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  status: string;
  changes: Record<string, EnrichmentChange>;
  enrichedAt: string;
}

interface EnrichmentReviewProps {
  entityType: string;
  entityId: string;
}

// MVP: static data, tRPC will be wired later
const MOCK_LOGS: EnrichmentLogEntry[] = [
  {
    id: "log-1",
    sourceName: "OpenCorporates",
    sourceUrl: "https://opencorporates.com/companies/gb/12345678",
    status: "pending",
    changes: {
      companyNumber: { old: null, new: "12345678", confidence: 0.85 },
      jurisdiction: { old: null, new: "gb", confidence: 0.9 },
      incorporationDate: { old: null, new: "2015-03-15", confidence: 0.95 },
    },
    enrichedAt: new Date().toISOString(),
  },
  {
    id: "log-2",
    sourceName: "UK Companies House",
    sourceUrl:
      "https://find-and-update.company-information.service.gov.uk/company/12345",
    status: "pending",
    changes: {
      registeredAddress: {
        old: null,
        new: "123 Example Street, London, EC1A 1BB",
        confidence: 0.85,
      },
      companyStatus: { old: null, new: "Active", confidence: 0.95 },
    },
    enrichedAt: new Date().toISOString(),
  },
];

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const variant = confidence >= 0.9 ? "default" : "secondary";

  return <Badge variant={variant}>{pct}%</Badge>;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  return String(value);
}

function LogCard({
  log,
  onAccept,
  onReject,
}: {
  log: EnrichmentLogEntry;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isPending = log.status === "pending";

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{log.sourceName}</h3>
          <Badge
            variant={
              log.status === "applied"
                ? "default"
                : log.status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
          >
            {log.status}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(log.enrichedAt).toLocaleString()}
        </span>
      </div>

      {log.sourceUrl && (
        <p className="text-xs text-muted-foreground">
          Source:{" "}
          <a
            href={log.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {log.sourceUrl}
          </a>
        </p>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Field</th>
              <th className="px-3 py-2 text-left font-medium">Old value</th>
              <th className="px-3 py-2 text-left font-medium">New value</th>
              <th className="px-3 py-2 text-left font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(log.changes).map(([field, change]) => (
              <tr key={field} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{field}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatValue(change.old)}
                </td>
                <td className="px-3 py-2">{formatValue(change.new)}</td>
                <td className="px-3 py-2">
                  <ConfidenceBadge confidence={change.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPending && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReject(log.id)}
          >
            Reject
          </Button>
          <Button size="sm" onClick={() => onAccept(log.id)}>
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}

export function EnrichmentReview({
  entityType,
  entityId,
}: EnrichmentReviewProps) {
  const [logs, setLogs] = React.useState<EnrichmentLogEntry[]>(MOCK_LOGS);

  // Suppress unused parameter warnings — will be used when tRPC is wired
  void entityType;
  void entityId;

  function handleAccept(logId: string) {
    // TODO: Call tRPC enrichment.reviewEnrichment({ logId, action: "accept" })
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: "applied" } : l)),
    );
  }

  function handleReject(logId: string) {
    // TODO: Call tRPC enrichment.reviewEnrichment({ logId, action: "reject" })
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: "rejected" } : l)),
    );
  }

  const pendingLogs = logs.filter((l) => l.status === "pending");
  const reviewedLogs = logs.filter((l) => l.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Enrichment Review</h2>
        <p className="text-sm text-muted-foreground">
          Review pending enrichment data before it is applied to this record.
        </p>
      </div>

      {pendingLogs.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">
            Pending review ({pendingLogs.length})
          </h3>
          {pendingLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No pending enrichment data to review.
        </p>
      )}

      {reviewedLogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">
            Reviewed ({reviewedLogs.length})
          </h3>
          {reviewedLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
