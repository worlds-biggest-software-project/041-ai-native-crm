"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CompanyTable,
  type Company,
} from "@/components/companies/company-table";

// MVP: empty array, tRPC will be wired later
const INITIAL_COMPANIES: Company[] = [];

export default function CompaniesPage() {
  const [search, setSearch] = React.useState("");
  const companies = INITIAL_COMPANIES;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <Button>New Company</Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <CompanyTable companies={companies} />
    </div>
  );
}
