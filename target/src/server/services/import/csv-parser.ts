export interface CsvParseOptions {
  columnMapping: Record<string, string>; // CSV header -> entity field
  deduplicateBy?: string; // field name to deduplicate by (e.g., "email")
  skipHeader?: boolean;
}

export interface CsvParseResult {
  records: Record<string, unknown>[];
  duplicates: number;
  errors: { row: number; message: string }[];
}

/**
 * Parse a single CSV line handling quoted fields, commas in quotes,
 * and newlines in quotes. Returns the fields and the character index
 * where the line ends.
 */
function parseCsvLine(
  text: string,
  startIndex: number,
): { fields: string[]; endIndex: number } {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = startIndex;

  while (i < text.length) {
    const char = text[i]!;

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ",") {
        fields.push(current);
        current = "";
        i++;
      } else if (char === "\r" || char === "\n") {
        // End of line
        fields.push(current);
        // Skip \r\n or \n
        if (char === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
          i += 2;
        } else {
          i++;
        }
        return { fields, endIndex: i };
      } else {
        current += char;
        i++;
      }
    }
  }

  // End of text
  fields.push(current);
  return { fields, endIndex: i };
}

/**
 * Parse all lines from CSV text, respecting quoted fields that may
 * span multiple lines.
 */
function parseAllLines(text: string): string[][] {
  const lines: string[][] = [];
  let index = 0;

  while (index < text.length) {
    // Skip empty lines
    if (text[index] === "\n") {
      index++;
      continue;
    }
    if (text[index] === "\r") {
      index++;
      if (index < text.length && text[index] === "\n") {
        index++;
      }
      continue;
    }

    const { fields, endIndex } = parseCsvLine(text, index);
    lines.push(fields);
    index = endIndex;
  }

  return lines;
}

export function parseCsv(
  csvText: string,
  options: CsvParseOptions,
): CsvParseResult {
  const records: Record<string, unknown>[] = [];
  const errors: { row: number; message: string }[] = [];
  let duplicates = 0;

  const allLines = parseAllLines(csvText);
  if (allLines.length === 0) {
    return { records, duplicates, errors };
  }

  // First line is always the header (unless skipHeader is explicitly false — but
  // skipHeader actually means "the file has no header row", which is unusual for
  // our use-case where column mapping references header names).
  const headerLine = allLines[0];
  if (!headerLine) {
    return { records, duplicates, errors };
  }

  const headers = headerLine.map((h) => h.trim());
  const dataLines = allLines.slice(1);

  // Build reverse mapping: column index -> target field name
  const indexToField = new Map<number, string>();
  for (const [csvHeader, entityField] of Object.entries(
    options.columnMapping,
  )) {
    const idx = headers.indexOf(csvHeader);
    if (idx !== -1) {
      indexToField.set(idx, entityField);
    }
  }

  const seenValues = new Set<string>();

  for (let rowIdx = 0; rowIdx < dataLines.length; rowIdx++) {
    const line = dataLines[rowIdx]!;
    const rowNumber = rowIdx + 2; // 1-indexed, +1 for header

    if (line.length === 0 || (line.length === 1 && line[0]?.trim() === "")) {
      continue; // skip empty rows
    }

    if (line.length !== headers.length) {
      errors.push({
        row: rowNumber,
        message: `Expected ${headers.length} columns but found ${line.length}`,
      });
      continue;
    }

    const record: Record<string, unknown> = {};

    for (const [colIdx, fieldName] of indexToField.entries()) {
      const value = line[colIdx];
      record[fieldName] = value !== undefined ? value.trim() : "";
    }

    // Deduplication
    if (options.deduplicateBy) {
      const dedupeValue = String(
        record[options.deduplicateBy] ?? "",
      ).toLowerCase();
      if (dedupeValue && seenValues.has(dedupeValue)) {
        duplicates++;
        continue;
      }
      if (dedupeValue) {
        seenValues.add(dedupeValue);
      }
    }

    records.push(record);
  }

  return { records, duplicates, errors };
}
