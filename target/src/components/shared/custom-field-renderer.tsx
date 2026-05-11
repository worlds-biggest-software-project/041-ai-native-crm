"use client";

import { cn } from "@/lib/utils";

interface CustomFieldRendererProps {
  fieldType: string;
  fieldKey: string;
  displayName: string;
  value: unknown;
  onChange: (value: unknown) => void;
  options?: { value: string; label: string; color?: string }[];
  isRequired?: boolean;
  disabled?: boolean;
}

const inputClasses =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const selectClasses =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CustomFieldRenderer({
  fieldType,
  fieldKey,
  displayName,
  value,
  onChange,
  options,
  isRequired,
  disabled,
}: CustomFieldRendererProps) {
  const id = `field-${fieldKey}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {displayName}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </label>
      {renderInput()}
    </div>
  );

  function renderInput() {
    switch (fieldType) {
      case "text":
      case "email":
      case "url":
      case "phone":
        return (
          <input
            id={id}
            type={fieldType === "phone" ? "tel" : fieldType}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case "number":
      case "currency":
        return (
          <input
            id={id}
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              onChange(Number.isNaN(num) ? undefined : num);
            }}
            required={isRequired}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case "date":
        return (
          <input
            id={id}
            type="date"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case "datetime":
        return (
          <input
            id={id}
            type="datetime-local"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case "checkbox":
        return (
          <input
            id={id}
            type="checkbox"
            checked={typeof value === "boolean" ? value : false}
            onChange={(e) => onChange(e.target.checked)}
            required={isRequired}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );

      case "select":
        return (
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            disabled={disabled}
            className={selectClasses}
          >
            <option value="">Select...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "multi_select":
        return (
          <div className="space-y-1" role="group" aria-labelledby={id}>
            {options?.map((opt) => {
              const selectedValues = Array.isArray(value) ? value : [];
              const checked = selectedValues.includes(opt.value);

              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      if (checked) {
                        onChange(
                          selectedValues.filter(
                            (v: unknown) => v !== opt.value,
                          ),
                        );
                      } else {
                        onChange([...selectedValues, opt.value]);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        );

      case "rich_text":
        return (
          <textarea
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            disabled={disabled}
            rows={4}
            className={cn(inputClasses, "h-auto py-2")}
          />
        );

      default:
        return (
          <input
            id={id}
            type="text"
            value={typeof value === "string" ? String(value) : ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            disabled={disabled}
            className={inputClasses}
          />
        );
    }
  }
}
