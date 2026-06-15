type StoredWorkOrderValueProps = {
  value: string | null;
  fallback: string;
};

type BreakableDetailValueProps = {
  value: string;
};

type ParsedPartLine = {
  name: string;
  cost: string | null;
};

/**
 * Renders serialized work order parts as compact internal rows.
 *
 * Expected stored format:
 * - Pastillas delanteras — $ 50.000
 */
export function WorkOrderPartsValue({
  value,
  fallback,
}: StoredWorkOrderValueProps) {
  const lines = splitStoredList(value);

  if (lines.length === 0) {
    return <span>{fallback}</span>;
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const part = parsePartLine(line);

        return (
          <div
            key={`${part.name}-${index.toString()}`}
            className="grid gap-1 rounded-xl border border-border bg-background/55 px-3 py-2 ring-1 ring-white/3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="wrap-break-word text-sm font-bold text-white">
              {part.name}
            </span>

            {part.cost ? (
              <span className="text-sm font-black text-primary">
                {part.cost}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders serialized internal notes as compact stacked rows.
 */
export function WorkOrderNotesValue({
  value,
  fallback,
}: StoredWorkOrderValueProps) {
  const lines = splitStoredList(value);

  if (lines.length === 0) {
    return <span>{fallback}</span>;
  }

  return (
    <ul className="space-y-2">
      {lines.map((line, index) => (
        <li
          key={`${line}-${index.toString()}`}
          className="flex gap-2 rounded-xl border border-border bg-background/55 px-3 py-2 ring-1 ring-white/3"
        >
          <span aria-hidden="true" className="text-primary">
            •
          </span>

          <span className="wrap-break-word text-sm font-bold text-white">
            {stripListPrefix(line)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Forces long operational strings like emails to wrap inside narrow sheet cells.
 */
export function BreakableDetailValue({ value }: BreakableDetailValueProps) {
  return (
    <span className="block min-w-0 max-w-full wrap-break-word">
      {value}
    </span>
  );
}

/**
 * Splits stored multiline text into clean list rows.
 */
function splitStoredList(value: string | null): string[] {
  if (!value || value.trim().length === 0) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Parses a stored part row into name and optional cost.
 */
function parsePartLine(line: string): ParsedPartLine {
  const normalizedLine = stripListPrefix(line);
  const [rawName, rawCost] = normalizedLine.split(/\s+—\s+/u);

  return {
    name: rawName?.trim() ?? normalizedLine,
    cost: rawCost?.trim() || null,
  };
}

/**
 * Removes common bullet prefixes from stored rows.
 */
function stripListPrefix(value: string): string {
  return value.replace(/^[-•]\s*/, "").trim();
}