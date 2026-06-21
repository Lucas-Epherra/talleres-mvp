type NotesValueProps = {
  value: string | null | undefined;
  fallback?: string;
};

/**
 * Renders multiline internal notes as compact separated note items.
 *
 * Notes are stored as one item per line. Empty lines are ignored so persisted
 * notes remain readable even when users add extra spacing.
 */
export function NotesValue({ value, fallback = "Sin notas" }: NotesValueProps) {
  const notes = parseNotes(value);

  if (notes.length === 0) {
    return <span className="text-muted-foreground">{fallback}</span>;
  }

  return (
    <ul className="grid gap-2">
      {notes.map((note, index) => (
        <li
          key={`${note}-${index.toString()}`}
          className="rounded-xl border border-border bg-background/55 px-4 py-3 text-sm font-bold leading-6 text-white ring-1 ring-white/3"
        >
          <span className="mr-2 text-primary">·</span>
          <span className="wrap-anywhere">{note}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Converts persisted notes into displayable note items.
 */
function parseNotes(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}
