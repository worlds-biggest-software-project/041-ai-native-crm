"use client";

import { Badge } from "@/components/ui/badge";

interface ContactDetailProps {
  contactId: string;
}

const fieldLabels: { key: string; label: string }[] = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "jobTitle", label: "Job Title" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "lifecycleStage", label: "Lifecycle Stage" },
  { key: "source", label: "Source" },
  { key: "leadScore", label: "Lead Score" },
];

export function ContactDetail({ contactId }: ContactDetailProps) {
  // TODO: Fetch contact data via tRPC using contactId
  // For now, render placeholder fields

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fieldLabels.map((field) => (
          <div key={field.key} className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
              {field.label}
            </dt>
            <dd className="text-sm">
              {field.key === "lifecycleStage" ? (
                <Badge variant="secondary">Lead</Badge>
              ) : (
                <span className="text-muted-foreground">Loading...</span>
              )}
            </dd>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Contact ID: {contactId}
      </p>
    </div>
  );
}
