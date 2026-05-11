"use client";

import { useState, type ChangeEvent } from "react";

type ImportStep = "upload" | "preview" | "mapping" | "confirm" | "success";

interface ParsedRow {
  [key: string]: string;
}

const CONTACT_FIELDS = [
  "fullName",
  "firstName",
  "lastName",
  "email",
  "phone",
  "jobTitle",
  "companyName",
  "city",
  "countryCode",
  "source",
] as const;

function parseSimpleCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function parseSimpleVCard(text: string): ParsedRow[] {
  const blocks = text.split(/END:VCARD/i).filter((b) => b.includes("BEGIN:VCARD"));
  return blocks.map((block) => {
    const row: ParsedRow = {};
    const lines = block.split(/\r?\n/);
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const rawProp = line.substring(0, colonIdx);
      const propName = rawProp.split(";")[0]?.toUpperCase() ?? "";
      const value = line.substring(colonIdx + 1).trim();
      if (propName === "FN") row["fullName"] = value;
      if (propName === "N") {
        const parts = value.split(";");
        if (parts[0]) row["lastName"] = parts[0];
        if (parts[1]) row["firstName"] = parts[1];
      }
      if (propName === "EMAIL") row["email"] = value;
      if (propName === "TEL") row["phone"] = value;
      if (propName === "TITLE") row["jobTitle"] = value;
      if (propName === "ORG") row["companyName"] = value.split(";")[0] ?? "";
    }
    return row;
  });
}

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileType, setFileType] = useState<"csv" | "vcf" | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [vcfRecords, setVcfRecords] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importCount, setImportCount] = useState(0);
  const [duplicateCount] = useState(0);

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      if (file.name.endsWith(".vcf")) {
        setFileType("vcf");
        const records = parseSimpleVCard(text);
        setVcfRecords(records);
        setImportCount(records.length);
        setStep("preview");
      } else {
        setFileType("csv");
        const { headers, rows } = parseSimpleCsv(text);
        setCsvHeaders(headers);
        setCsvRows(rows);
        setImportCount(rows.length);
        // Initialize mapping: try to auto-match headers to fields
        const autoMap: Record<string, string> = {};
        for (const header of headers) {
          const lower = header.toLowerCase().replace(/[_\s]/g, "");
          const match = CONTACT_FIELDS.find(
            (f) => f.toLowerCase() === lower,
          );
          if (match) autoMap[header] = match;
        }
        setColumnMapping(autoMap);
        setStep("preview");
      }
    };
    reader.readAsText(file);
  }

  function handleMappingChange(csvHeader: string, entityField: string) {
    setColumnMapping((prev) => ({ ...prev, [csvHeader]: entityField }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Import Contacts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV or vCard file to import contacts
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {(["upload", "preview", ...(fileType === "csv" ? ["mapping"] : []), "confirm", "success"] as const).map(
          (s, i) => (
            <span
              key={s}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                step === s
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          ),
        )}
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4 rounded border-2 border-dashed border-gray-300 p-12">
            <p className="text-sm text-gray-500">
              Choose a .csv or .vcf file to import
            </p>
            <input
              type="file"
              accept=".csv,.vcf"
              onChange={handleFileUpload}
              className="text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Preview</h2>
          <p className="mb-4 text-sm text-gray-500">
            Showing first 5 rows of parsed data
          </p>
          <div className="overflow-x-auto">
            {fileType === "csv" ? (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    {csvHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvRows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    {["fullName", "firstName", "lastName", "email", "phone"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vcfRecords.slice(0, 5).map((rec, i) => (
                    <tr key={i}>
                      {["fullName", "firstName", "lastName", "email", "phone"].map(
                        (field) => (
                          <td key={field} className="px-3 py-2 text-gray-700">
                            {rec[field] ?? ""}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setStep("upload")}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() =>
                setStep(fileType === "csv" ? "mapping" : "confirm")
              }
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Column Mapping Step (CSV only) */}
      {step === "mapping" && fileType === "csv" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Column Mapping
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Map CSV columns to contact fields
          </p>
          <div className="space-y-3">
            {csvHeaders.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <span className="w-40 shrink-0 text-sm font-medium text-gray-700">
                  {header}
                </span>
                <span className="text-gray-400">&rarr;</span>
                <select
                  value={columnMapping[header] ?? ""}
                  onChange={(e) =>
                    handleMappingChange(header, e.target.value)
                  }
                  className="rounded border px-3 py-1.5 text-sm text-gray-700"
                >
                  <option value="">-- Skip --</option>
                  {CONTACT_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setStep("preview")}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep("confirm")}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm Step */}
      {step === "confirm" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Confirm Import</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">{importCount}</span> records to
              import
            </p>
            {duplicateCount > 0 && (
              <p>
                <span className="font-medium">{duplicateCount}</span> duplicates
                will be skipped
              </p>
            )}
            <p>
              File type:{" "}
              <span className="font-medium uppercase">{fileType}</span>
            </p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() =>
                setStep(fileType === "csv" ? "mapping" : "preview")
              }
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep("success")}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {/* Success Step */}
      {step === "success" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Import Complete
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Successfully imported {importCount} contacts
          </p>
          <button
            onClick={() => {
              setStep("upload");
              setFileType(null);
              setCsvHeaders([]);
              setCsvRows([]);
              setVcfRecords([]);
              setColumnMapping({});
              setImportCount(0);
            }}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
