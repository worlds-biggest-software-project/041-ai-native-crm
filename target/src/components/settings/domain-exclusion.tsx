"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DomainExclusionProps {
  domains: string[];
  onAdd: (domain: string) => void;
  onRemove: (domain: string) => void;
}

export function DomainExclusion({ domains, onAdd, onRemove }: DomainExclusionProps) {
  const [newDomain, setNewDomain] = React.useState("");

  function handleAdd() {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;
    if (domains.includes(trimmed)) return;
    onAdd(trimmed);
    setNewDomain("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Excluded Domains</h3>
        <p className="text-sm text-muted-foreground">
          Emails between addresses on these domains will not be synced as
          activities. Use this to exclude internal company communications.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="e.g. yourcompany.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!newDomain.trim()}
        >
          Add
        </Button>
      </div>

      {domains.length > 0 ? (
        <ul className="space-y-2">
          {domains.map((domain) => (
            <li
              key={domain}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm font-mono">{domain}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(domain)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No domains excluded. All emails will be synced.
        </p>
      )}
    </div>
  );
}
