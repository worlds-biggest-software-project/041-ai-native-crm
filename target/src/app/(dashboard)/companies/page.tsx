"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  useDialogClose,
} from "@/components/ui/dialog";
import {
  CompanyTable,
  type Company,
} from "@/components/companies/company-table";
import { trpc } from "@/lib/trpc-client";

export default function CompaniesPage() {
  const [search, setSearch] = React.useState("");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCompanies = React.useCallback(async () => {
    try {
      const result = await trpc.companies.list.query({
        search: search || undefined,
      });
      setCompanies(result.items as Company[]);
    } catch {
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCompanies, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
            New Company
          </DialogTrigger>
          <CreateCompanyForm onCreated={fetchCompanies} />
        </Dialog>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading companies...</p>
      ) : (
        <CompanyTable companies={companies} />
      )}
    </div>
  );
}

function CreateCompanyForm({ onCreated }: { onCreated: () => void }) {
  const close = useDialogClose();
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await trpc.companies.create.mutate({
        name: name.trim(),
        domain: domain.trim() || undefined,
        industry: industry.trim() || undefined,
      });
      close();
      onCreated();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create company",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Company</DialogTitle>
      </DialogHeader>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="companyName">
            Company Name *
          </label>
          <Input
            id="companyName"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="domain">
            Domain
          </label>
          <Input
            id="domain"
            placeholder="acme.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="industry">
            Industry
          </label>
          <Input
            id="industry"
            placeholder="Technology"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        {formError && (
          <p className="text-sm text-red-600">{formError}</p>
        )}
        <DialogFooter>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Creating..." : "Create Company"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
