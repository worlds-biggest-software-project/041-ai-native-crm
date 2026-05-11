"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, Handshake, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal";
  title: string;
  subtitle: string;
}

const typeConfig = {
  contact: { label: "Contacts", icon: Users, path: "/contacts" },
  company: { label: "Companies", icon: Building2, path: "/companies" },
  deal: { label: "Deals", icon: Handshake, path: "/deals" },
} as const;

function groupResults(results: SearchResult[]) {
  const groups: Record<string, SearchResult[]> = {};
  for (const result of results) {
    if (!groups[result.type]) groups[result.type] = [];
    groups[result.type]!.push(result);
  }
  return groups;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            // Closing — reset state
            setQuery("");
            setResults([]);
            setLoading(false);
            return false;
          }
          return true;
        });
      }
      if (e.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      try {
        // TODO: Wire to tRPC global search endpoint
        // For MVP, simulate search results structure
        // Once the search tRPC route is ready, replace with:
        // const res = await trpc.search.global.query({ query, limit: 10 });
        const simulatedResults: SearchResult[] = [];
        setResults(simulatedResults);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [query]);

  function handleSelect(result: SearchResult) {
    const config = typeConfig[result.type];
    router.push(`${config.path}/${result.id}`);
    close();
  }

  if (!open) return null;

  const grouped = groupResults(results);
  const hasResults = results.length > 0;
  const hasQuery = query.length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={close}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") close();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close command palette"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gray-400" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, companies, deals..."
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Results area */}
        {loading && hasQuery && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Searching...
          </div>
        )}

        {!loading && hasQuery && !hasResults && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No results found
          </div>
        )}

        {!loading && hasResults && (
          <div className="max-h-80 overflow-y-auto py-2">
            {(["contact", "company", "deal"] as const).map((type) => {
              const items = grouped[type];
              if (!items?.length) return null;
              const config = typeConfig[type];
              const Icon = config.icon;

              return (
                <div key={type}>
                  <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {config.label} ({items.length})
                  </div>
                  {items.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelect(result)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm",
                        "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="truncate text-xs text-gray-500">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {!hasQuery && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Start typing to search...
          </div>
        )}
      </div>
    </div>
  );
}
