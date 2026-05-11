export interface ParsedContact {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  companyName?: string;
  address?: string;
}

/**
 * Unfold lines per RFC 6350: lines starting with a space or tab
 * are continuations of the previous line.
 */
function unfoldLines(text: string): string {
  return text.replace(/\r\n([ \t])/g, "").replace(/\n([ \t])/g, "");
}

/**
 * Extract the value from a vCard property line.
 * Handles lines like "EMAIL;TYPE=WORK:user@example.com" by stripping
 * everything before and including the first colon.
 */
function getPropertyValue(line: string): string {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return "";
  return line.substring(colonIndex + 1).trim();
}

/**
 * Get the property name (uppercase) from a line, ignoring parameters.
 */
function getPropertyName(line: string): string {
  const colonIndex = line.indexOf(":");
  const semicolonIndex = line.indexOf(";");
  let endIndex: number;
  if (colonIndex === -1) {
    endIndex = line.length;
  } else if (semicolonIndex !== -1 && semicolonIndex < colonIndex) {
    endIndex = semicolonIndex;
  } else {
    endIndex = colonIndex;
  }
  return line.substring(0, endIndex).toUpperCase();
}

export function parseVCardSingle(block: string): ParsedContact {
  const result: ParsedContact = { fullName: "" };
  const lines = block.split(/\r?\n/);

  for (const line of lines) {
    const propName = getPropertyName(line);
    const value = getPropertyValue(line);

    switch (propName) {
      case "FN":
        result.fullName = value;
        break;
      case "N": {
        // N:lastName;firstName;middleName;prefix;suffix
        const parts = value.split(";");
        if (parts[0]) result.lastName = parts[0];
        if (parts[1]) result.firstName = parts[1];
        break;
      }
      case "EMAIL":
        result.email = value;
        break;
      case "TEL":
        result.phone = value;
        break;
      case "TITLE":
        result.title = value;
        break;
      case "ORG":
        result.companyName = value.split(";")[0] ?? undefined;
        break;
      case "ADR": {
        // ADR:poBox;ext;street;city;region;postalCode;country
        const addrParts = value.split(";").filter(Boolean);
        if (addrParts.length > 0) {
          result.address = addrParts.join(", ");
        }
        break;
      }
    }
  }

  // Fallback: if no FN but we have N parts, compose fullName
  if (!result.fullName && (result.firstName || result.lastName)) {
    result.fullName = [result.firstName, result.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return result;
}

export function parseVCard(vcardText: string): ParsedContact[] {
  if (!vcardText.trim()) return [];

  const unfolded = unfoldLines(vcardText);
  const results: ParsedContact[] = [];

  // Split into BEGIN:VCARD ... END:VCARD blocks
  const blockRegex = /BEGIN:VCARD\s*\r?\n([\s\S]*?)END:VCARD/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(unfolded)) !== null) {
    const blockContent = match[1];
    if (blockContent) {
      results.push(parseVCardSingle(blockContent));
    }
  }

  return results;
}
