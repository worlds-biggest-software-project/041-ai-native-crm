"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface EnrichmentSourceItem {
  id: string;
  name: string;
  sourceType: string;
  gdprBasis: string | null;
  liaDocumentUrl: string | null;
  isActive: boolean;
  autoApplyThreshold: number;
}

// MVP: static data, tRPC will be wired later
const MOCK_SOURCES: EnrichmentSourceItem[] = [
  {
    id: "src-1",
    name: "OpenCorporates",
    sourceType: "opencorporates",
    gdprBasis: "public_data",
    liaDocumentUrl: null,
    isActive: true,
    autoApplyThreshold: 0.9,
  },
  {
    id: "src-2",
    name: "UK Companies House",
    sourceType: "company_registries",
    gdprBasis: "legitimate_interest",
    liaDocumentUrl: "https://example.com/lia-companies-house.pdf",
    isActive: true,
    autoApplyThreshold: 0.85,
  },
  {
    id: "src-3",
    name: "SEC EDGAR",
    sourceType: "company_registries_sec",
    gdprBasis: "public_data",
    liaDocumentUrl: null,
    isActive: false,
    autoApplyThreshold: 0.9,
  },
];

function GdprBasisBadge({ basis }: { basis: string | null }) {
  if (!basis) {
    return <Badge variant="destructive">No GDPR basis</Badge>;
  }

  const label = basis.replace(/_/g, " ");
  return <Badge variant="secondary">{label}</Badge>;
}

function SourceCard({
  source,
  onToggle,
  onThresholdChange,
}: {
  source: EnrichmentSourceItem;
  onToggle: (id: string) => void;
  onThresholdChange: (id: string, value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{source.name}</h3>
            {source.isActive ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
            <GdprBasisBadge basis={source.gdprBasis} />
          </div>
          <p className="text-sm text-muted-foreground">
            Type: {source.sourceType}
          </p>
        </div>
        <Button
          variant={source.isActive ? "destructive" : "default"}
          size="sm"
          onClick={() => onToggle(source.id)}
        >
          {source.isActive ? "Disable" : "Enable"}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Auto-apply threshold: {Math.round(source.autoApplyThreshold * 100)}%
        </label>
        <Input
          type="range"
          min={0}
          max={100}
          value={Math.round(source.autoApplyThreshold * 100)}
          onChange={(e) =>
            onThresholdChange(source.id, parseInt(e.target.value, 10) / 100)
          }
          className="w-full max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Changes with confidence at or above this threshold will be applied
          automatically. Below this, they require manual review.
        </p>
      </div>

      {source.liaDocumentUrl && (
        <div className="text-sm">
          <span className="font-medium">LIA Document: </span>
          <a
            href={source.liaDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {source.liaDocumentUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default function EnrichmentSettingsPage() {
  const [sources, setSources] =
    React.useState<EnrichmentSourceItem[]>(MOCK_SOURCES);

  function handleToggle(id: string) {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    );
  }

  function handleThresholdChange(id: string, value: number) {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, autoApplyThreshold: value } : s)),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Enrichment Sources
        </h1>
        <p className="text-muted-foreground">
          Configure data enrichment sources for contacts and companies. Each
          source must have a documented GDPR legal basis before it can be used.
        </p>
      </div>

      <div className="space-y-4">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onToggle={handleToggle}
            onThresholdChange={handleThresholdChange}
          />
        ))}
      </div>

      {sources.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No enrichment sources configured.
        </p>
      )}
    </div>
  );
}
