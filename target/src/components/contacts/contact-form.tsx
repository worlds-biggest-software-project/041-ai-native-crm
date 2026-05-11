"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Contact } from "@/server/db/schema/contacts";

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  lifecycleStage: string;
  companyId: string;
  ownerId: string;
}

const lifecycleStages = [
  { value: "lead", label: "Lead" },
  { value: "subscriber", label: "Subscriber" },
  { value: "opportunity", label: "Opportunity" },
  { value: "customer", label: "Customer" },
  { value: "evangelist", label: "Evangelist" },
  { value: "other", label: "Other" },
] as const;

export function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = React.useState<ContactFormData>({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    fullName: contact?.fullName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    jobTitle: contact?.jobTitle ?? "",
    lifecycleStage: contact?.lifecycleStage ?? "lead",
    companyId: contact?.companyId ?? "",
    ownerId: contact?.ownerId ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* First Name */}
        <div className="space-y-2">
          <label
            htmlFor="firstName"
            className="text-sm font-medium leading-none"
          >
            First Name
          </label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First name"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label
            htmlFor="lastName"
            className="text-sm font-medium leading-none"
          >
            Last Name
          </label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last name"
          />
        </div>

        {/* Full Name */}
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="fullName"
            className="text-sm font-medium leading-none"
          >
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full name"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium leading-none">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <label
            htmlFor="jobTitle"
            className="text-sm font-medium leading-none"
          >
            Job Title
          </label>
          <Input
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            placeholder="Job title"
          />
        </div>

        {/* Lifecycle Stage */}
        <div className="space-y-2">
          <label
            htmlFor="lifecycleStage"
            className="text-sm font-medium leading-none"
          >
            Lifecycle Stage
          </label>
          <select
            id="lifecycleStage"
            name="lifecycleStage"
            value={formData.lifecycleStage}
            onChange={handleChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {lifecycleStages.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>

        {/* Company (placeholder) */}
        <div className="space-y-2">
          <label
            htmlFor="companyId"
            className="text-sm font-medium leading-none"
          >
            Company
          </label>
          <Input
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            placeholder="Company ID (placeholder)"
          />
        </div>

        {/* Owner (placeholder) */}
        <div className="space-y-2">
          <label htmlFor="ownerId" className="text-sm font-medium leading-none">
            Owner
          </label>
          <Input
            id="ownerId"
            name="ownerId"
            value={formData.ownerId}
            onChange={handleChange}
            placeholder="Owner ID (placeholder)"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {contact ? "Update Contact" : "Create Contact"}
        </Button>
      </div>
    </form>
  );
}
