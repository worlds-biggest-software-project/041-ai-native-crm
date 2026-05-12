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
  ContactTable,
  type Contact,
} from "@/components/contacts/contact-table";
import { trpc } from "@/lib/trpc-client";

export default function ContactsPage() {
  const [search, setSearch] = React.useState("");
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchContacts = React.useCallback(async () => {
    try {
      const result = await trpc.contacts.list.query({
        search: search || undefined,
      });
      setContacts(result.items as Contact[]);
    } catch {
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchContacts, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
            New Contact
          </DialogTrigger>
          <CreateContactForm onCreated={fetchContacts} />
        </Dialog>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search contacts..."
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
        <p className="text-sm text-muted-foreground">Loading contacts...</p>
      ) : (
        <ContactTable contacts={contacts} />
      )}
    </div>
  );
}

function CreateContactForm({ onCreated }: { onCreated: () => void }) {
  const close = useDialogClose();
  const [saving, setSaving] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await trpc.contacts.create.mutate({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      });
      close();
      onCreated();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create contact",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Contact</DialogTitle>
      </DialogHeader>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="fullName">
            Full Name *
          </label>
          <Input
            id="fullName"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="phone">
            Phone
          </label>
          <Input
            id="phone"
            placeholder="+1 555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="jobTitle">
            Job Title
          </label>
          <Input
            id="jobTitle"
            placeholder="VP of Sales"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        {formError && (
          <p className="text-sm text-red-600">{formError}</p>
        )}
        <DialogFooter>
          <Button type="submit" disabled={saving || !fullName.trim()}>
            {saving ? "Creating..." : "Create Contact"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
