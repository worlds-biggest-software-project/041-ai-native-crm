"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContactTable,
  type Contact,
} from "@/components/contacts/contact-table";

// MVP: empty array, tRPC will be wired later
const INITIAL_CONTACTS: Contact[] = [];

export default function ContactsPage() {
  const [search, setSearch] = React.useState("");
  const contacts = INITIAL_CONTACTS;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <Button>New Contact</Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <ContactTable contacts={contacts} />
    </div>
  );
}
