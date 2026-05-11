"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Trash2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldDef {
  id: string;
  fieldKey: string;
  displayName: string;
  fieldType: string;
  isRequired: boolean;
  isSystem: boolean;
  displayOrder: number;
}

// ---------------------------------------------------------------------------
// Static seed data (placeholder until wired to tRPC)
// ---------------------------------------------------------------------------

const SEED_FIELDS: Record<string, FieldDef[]> = {
  contact: [
    {
      id: "sys-1",
      fieldKey: "email",
      displayName: "Email",
      fieldType: "email",
      isRequired: true,
      isSystem: true,
      displayOrder: 0,
    },
    {
      id: "sys-2",
      fieldKey: "phone",
      displayName: "Phone",
      fieldType: "phone",
      isRequired: false,
      isSystem: true,
      displayOrder: 1,
    },
  ],
  company: [
    {
      id: "sys-3",
      fieldKey: "domain",
      displayName: "Domain",
      fieldType: "url",
      isRequired: false,
      isSystem: true,
      displayOrder: 0,
    },
  ],
  deal: [],
};

const ENTITY_TABS = [
  { key: "contact", label: "Contacts" },
  { key: "company", label: "Companies" },
  { key: "deal", label: "Deals" },
] as const;

const FIELD_TYPES = [
  "text",
  "number",
  "currency",
  "date",
  "datetime",
  "email",
  "url",
  "phone",
  "checkbox",
  "select",
  "multi_select",
  "rich_text",
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CustomFieldsSettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("contact");
  const [fields, setFields] = useState<Record<string, FieldDef[]>>(SEED_FIELDS);
  const [showForm, setShowForm] = useState(false);

  // New field form state
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("text");
  const [newRequired, setNewRequired] = useState(false);

  const currentFields = fields[activeTab] ?? [];

  function handleAddField() {
    if (!newKey.trim() || !newName.trim()) return;

    const field: FieldDef = {
      id: `custom-${Date.now()}`,
      fieldKey: newKey.trim(),
      displayName: newName.trim(),
      fieldType: newType,
      isRequired: newRequired,
      isSystem: false,
      displayOrder: currentFields.length,
    };

    setFields((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] ?? []), field],
    }));

    // Reset form
    setNewKey("");
    setNewName("");
    setNewType("text");
    setNewRequired(false);
    setShowForm(false);
  }

  function handleDeleteField(id: string) {
    setFields((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).filter((f) => f.id !== id),
    }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage custom fields for your CRM entities.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {/* Entity type tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add field form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">New Field</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-field-key"
                className="text-sm font-medium text-gray-700"
              >
                Field Key
              </label>
              <input
                id="new-field-key"
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. loyalty_tier"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-field-name"
                className="text-sm font-medium text-gray-700"
              >
                Display Name
              </label>
              <input
                id="new-field-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Loyalty Tier"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-field-type"
                className="text-sm font-medium text-gray-700"
              >
                Field Type
              </label>
              <select
                id="new-field-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Required
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddField}>Save</Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Field list */}
      {currentFields.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          No custom fields defined for this entity type.
        </div>
      ) : (
        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {currentFields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              {/* Drag handle (visual placeholder) */}
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-400" />

              {/* Key */}
              <span className="w-40 truncate font-mono text-sm text-gray-600">
                {field.fieldKey}
              </span>

              {/* Display name */}
              <span className="flex-1 truncate text-sm font-medium text-gray-900">
                {field.displayName}
              </span>

              {/* Type badge */}
              <Badge variant="secondary" className="text-xs">
                {field.fieldType}
              </Badge>

              {/* Required badge */}
              {field.isRequired && (
                <Badge variant="outline" className="text-xs">
                  required
                </Badge>
              )}

              {/* System badge */}
              {field.isSystem && (
                <Badge variant="outline" className="text-xs text-gray-400">
                  system
                </Badge>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDeleteField(field.id)}
                disabled={field.isSystem}
                className={cn(
                  "rounded p-1 transition-colors",
                  field.isSystem
                    ? "cursor-not-allowed text-gray-300"
                    : "text-gray-400 hover:bg-red-50 hover:text-red-500",
                )}
                aria-label={`Delete field ${field.displayName}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
