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
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Local Company type matching the schema shape
// ---------------------------------------------------------------------------
export interface Company {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  contactCount?: number | null;
  openDealCount?: number | null;
  ownerName?: string | null;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "domain",
    header: "Domain",
    cell: ({ getValue }) => {
      const domain = getValue() as string | null;
      if (!domain) return "—";
      return <span className="text-muted-foreground">{domain}</span>;
    },
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "contactCount",
    header: "Contact Count",
    cell: ({ getValue }) => {
      const count = getValue() as number | null;
      return <span className="tabular-nums">{count ?? 0}</span>;
    },
  },
  {
    accessorKey: "openDealCount",
    header: "Open Deals",
    cell: ({ getValue }) => {
      const count = getValue() as number | null;
      return <span className="tabular-nums">{count ?? 0}</span>;
    },
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CompanyTableProps {
  companies: Company[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CompanyTable({
  companies,
  loading = false,
}: CompanyTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  const table = useReactTable({
    data: companies,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
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
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/companies/${row.original.id}`)}
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
          {companies.length} compan{companies.length !== 1 ? "ies" : "y"}
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
