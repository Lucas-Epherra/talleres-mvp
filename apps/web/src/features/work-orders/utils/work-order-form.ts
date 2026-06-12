export type WorkOrderPartDraft = {
  id: string;
  name: string;
  cost: string;
};

export type WorkOrderNoteDraft = {
  id: string;
  value: string;
};

type CompleteWorkOrderPart = {
  name: string;
  cost: number;
};

/**
 * Creates an empty work order part draft with a stable client-side id.
 */
export function createEmptyWorkOrderPart(): WorkOrderPartDraft {
  return {
    id: createClientId(),
    name: "",
    cost: "",
  };
}

/**
 * Creates an empty internal note draft with a stable client-side id.
 */
export function createEmptyWorkOrderNote(): WorkOrderNoteDraft {
  return {
    id: createClientId(),
    value: "",
  };
}

/**
 * Parses API text/cost fields into editable part rows.
 *
 * This keeps backwards compatibility with old free-text parts while supporting
 * the new structured MVP format.
 */
export function parseWorkOrderParts(
  partsUsed: string | null,
  partsCost: number | string | null,
): WorkOrderPartDraft[] {
  const normalizedPartsUsed = (partsUsed ?? "").trim();
  const fallbackCost = apiMoneyToInputString(partsCost);

  if (!normalizedPartsUsed) {
    if (fallbackCost) {
      return [
        {
          id: createClientId(),
          name: "Repuestos cargados",
          cost: fallbackCost,
        },
      ];
    }

    return [createEmptyWorkOrderPart()];
  }

  const lines = normalizedPartsUsed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedSerializedParts = lines
    .map(parseSerializedPartLine)
    .filter((part): part is WorkOrderPartDraft => part !== null);

  if (parsedSerializedParts.length > 0) {
    return parsedSerializedParts;
  }

  return lines.map((line, index) => ({
    id: createClientId(),
    name: stripListPrefix(line),
    cost: index === 0 ? fallbackCost : "",
  }));
}

/**
 * Parses stored notes into editable note rows.
 */
export function parseWorkOrderNotes(notes: string | null): WorkOrderNoteDraft[] {
  const normalizedNotes = (notes ?? "").trim();

  if (!normalizedNotes) {
    return [createEmptyWorkOrderNote()];
  }

  return normalizedNotes
    .split("\n")
    .map((line) => stripListPrefix(line.trim()))
    .filter(Boolean)
    .map((value) => ({
      id: createClientId(),
      value,
    }));
}

/**
 * Returns a validation message when a part row is incomplete or invalid.
 */
export function validateWorkOrderParts(
  parts: WorkOrderPartDraft[],
): string | null {
  for (const part of parts) {
    const hasName = part.name.trim().length > 0;
    const hasCost = part.cost.trim().length > 0;

    if (hasName !== hasCost) {
      return "Cada repuesto cargado debe tener nombre y valor.";
    }

    if (hasName && parseMoneyInputValue(part.cost) === null) {
      return "El valor de cada repuesto debe ser un número válido.";
    }
  }

  return null;
}

/**
 * Calculates the total cost of all complete part rows.
 */
export function getWorkOrderPartsTotal(parts: WorkOrderPartDraft[]): number {
  return getCompleteWorkOrderParts(parts).reduce(
    (total, part) => total + part.cost,
    0,
  );
}

/**
 * Serializes structured part rows into the current API string field.
 */
export function serializeWorkOrderParts(
  parts: WorkOrderPartDraft[],
): string | null {
  const completeParts = getCompleteWorkOrderParts(parts);

  if (completeParts.length === 0) {
    return null;
  }

  return completeParts
    .map((part) => `- ${part.name} — ${formatCurrency(part.cost)}`)
    .join("\n");
}

/**
 * Serializes internal note rows into a readable bullet-list string.
 */
export function serializeWorkOrderNotes(
  notes: WorkOrderNoteDraft[],
): string | null {
  const normalizedNotes = notes
    .map((note) => note.value.trim())
    .filter(Boolean);

  if (normalizedNotes.length === 0) {
    return null;
  }

  return normalizedNotes.map((note) => `- ${note}`).join("\n");
}

/**
 * Converts a controlled money input value into a number.
 */
export function parseMoneyInputValue(value: string): number | null {
  const normalizedValue = value.trim().replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

/**
 * Converts nullable API money values into safe controlled input strings.
 */
export function apiMoneyToInputString(
  value: number | string | null,
): string {
  if (value === null || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "";
  }

  const parsedValue = parseSerializedMoney(value);

  return parsedValue === null ? "" : parsedValue.toString();
}

/**
 * Formats money values for read-only summaries.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Returns only complete part rows.
 */
function getCompleteWorkOrderParts(
  parts: WorkOrderPartDraft[],
): CompleteWorkOrderPart[] {
  return parts.flatMap((part) => {
    const name = part.name.trim();
    const cost = parseMoneyInputValue(part.cost);

    if (!name || cost === null) {
      return [];
    }

    return [
      {
        name,
        cost,
      },
    ];
  });
}

/**
 * Parses the serialized part format generated by this MVP form.
 */
function parseSerializedPartLine(line: string): WorkOrderPartDraft | null {
  const match = /^[-•]\s*(.*?)\s+—\s+(.*)$/u.exec(line);

  if (!match) {
    return null;
  }

  const [, rawName, rawCost] = match;
  const name = rawName?.trim() ?? "";
  const cost = parseSerializedMoney(rawCost ?? "");

  if (!name || cost === null) {
    return null;
  }

  return {
    id: createClientId(),
    name,
    cost: cost.toString(),
  };
}

/**
 * Parses formatted money text such as "$ 80.000" back into a number.
 */
function parseSerializedMoney(value: string): number | null {
  const cleanedValue = value.replace(/[^\d,.-]/g, "").trim();

  if (!cleanedValue) {
    return null;
  }

  const normalizedValue = cleanedValue.includes(",")
    ? cleanedValue.replace(/\./g, "").replace(",", ".")
    : cleanedValue.replace(/\.(?=\d{3}(\D|$))/g, "");

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

/**
 * Removes common bullet prefixes from existing text lines.
 */
function stripListPrefix(value: string): string {
  return value.replace(/^[-•]\s*/, "").trim();
}

/**
 * Generates a small client-safe id for dynamic form rows.
 */
function createClientId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `item-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}