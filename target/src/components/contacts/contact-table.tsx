"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Local Contact type matching the schema shape
// ---------------------------------------------------------------------------
export interface Contact {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  companyName?: string | null;
  lifecycleStage?: string | null;
  ownerName?: string | null;
  lastActivityAt?: string | Date | null;
  leadScore?: number | string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first[0]?.toUpperCase() ?? "?";
  const last = parts[parts.length - 1];
  return ((first[0] ?? "") + (last?.[0] ?? "")).toUpperCase();
}

const LIFECYCLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  lead: "outline",
  mql: "secondary",
  sql: "secondary",
  opportunity: "default",
  customer: "default",
  evangelist: "default",
};

function lifecycleBadgeVariant(
  stage?: string | null,
): "default" | "secondary" | "outline" {
  if (!stage) return "outline";
  return LIFECYCLE_VARIANT[stage.toLowerCase()] ?? "outline";
}

function formatRelativeDate(date?: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
    cell: ({ row }) => {
      const contact = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(contact.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{contact.fullName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {(getValue() as string | null) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "lifecycleStage",
    header: "Lifecycle Stage",
    cell: ({ getValue }) => {
      const stage = getValue() as string | null;
      if (!stage) return "—";
      return (
        <Badge variant={lifecycleBadgeVariant(stage)} className="capitalize">
          {stage}
        </Badge>
      );
    },
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "lastActivityAt",
    header: "Last Activity",
    cell: ({ getValue }) =>
      formatRelativeDate(getValue() as string | Date | null),
  },
  {
    accessorKey: "leadScore",
    header: "Lead Score",
    cell: ({ getValue }) => {
      const score = getValue() as number | string | null;
      if (score == null) return "—";
      return <span className="tabular-nums">{Number(score).toFixed(0)}</span>;
    },
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ContactTableProps {
  contacts: Contact[];
  onSort?: (sorting: SortingState) => void;
  onPageChange?: (pagination: PaginationState) => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ContactTable({
  contacts,
  onSort,
  onPageChange,
  loading = false,
}: ContactTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  const table = useReactTable({
    data: contacts,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      onSort?.(next);
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      onPageChange?.(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/contacts/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
