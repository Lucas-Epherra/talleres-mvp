"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";

type NoteDraft = {
  id: string;
  value: string;
};

type NotesEditorProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  disabled?: boolean;
  maxLength?: number;
  addLabel?: string;
  placeholder?: string;
};

/**
 * Generic internal notes editor.
 *
 * It stores notes as one item per line in a hidden form field, allowing regular
 * FormData readers to keep working without knowing about the dynamic UI.
 */
export function NotesEditor({
  name,
  label,
  defaultValue,
  disabled = false,
  maxLength = 800,
  addLabel = "Agregar nota",
  placeholder = "Ej: Prefiere comunicación por WhatsApp.",
}: NotesEditorProps) {
  const idPrefix = useId();
  const [notes, setNotes] = useState<NoteDraft[]>(() =>
    createInitialNotes(defaultValue, idPrefix),
  );

  const serializedValue = serializeNotes(notes);
  const usedCharacters = serializedValue.length;
  const isOverLimit = usedCharacters > maxLength;

  function updateNote(noteId: string, value: string) {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              value,
            }
          : note,
      ),
    );
  }

  function addNote() {
    setNotes((currentNotes) => [
      ...currentNotes,
      {
        id: `${idPrefix}-${currentNotes.length.toString()}-${Date.now().toString()}`,
        value: "",
      },
    ]);
  }

  function removeNote(noteId: string) {
    setNotes((currentNotes) => {
      if (currentNotes.length === 1) {
        return [
          {
            id: `${idPrefix}-0`,
            value: "",
          },
        ];
      }

      return currentNotes.filter((note) => note.id !== noteId);
    });
  }

  return (
    <section
      aria-labelledby={`${name}-notes-heading`}
      className="rounded-2xl border border-border bg-background/35 p-3 ring-1 ring-white/3 sm:p-4"
    >
      <input type="hidden" name={name} value={serializedValue} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Historial interno
          </p>

          <h3
            id={`${name}-notes-heading`}
            className="mt-2 font-display text-base font-black uppercase tracking-[0.04em] text-white"
          >
            {label}
          </h3>
        </div>

        <p
          className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
            isOverLimit
              ? "border-primary/45 bg-primary/10 text-white"
              : "border-border-strong bg-background/55 text-white"
          }`}
        >
          {usedCharacters}/{maxLength}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {notes.map((note, index) => (
          <div
            key={note.id}
            className="rounded-xl border border-border bg-surface/60 p-3"
          >
            <label
              htmlFor={`${name}-note-${note.id}`}
              className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
            >
              Nota {index + 1}
            </label>

            <textarea
              id={`${name}-note-${note.id}`}
              value={note.value}
              onChange={(event) => updateNote(note.id, event.target.value)}
              rows={3}
              placeholder={placeholder}
              disabled={disabled}
              className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => removeNote(note.id)}
              disabled={disabled}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-black text-white transition hover:border-primary/60 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Quitar nota ${index + 1}`}
            >
              <X className="size-4 shrink-0" aria-hidden="true" />
              Quitar nota
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addNote}
        disabled={disabled}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Plus className="size-4 shrink-0" aria-hidden="true" />
        {addLabel}
      </button>

      {isOverLimit ? (
        <p className="mt-3 text-sm font-semibold text-primary">
          Las notas superan el máximo permitido.
        </p>
      ) : null}
    </section>
  );
}

/**
 * Creates editable note rows from a persisted multiline value.
 */
function createInitialNotes(
  value: string | null | undefined,
  idPrefix: string,
): NoteDraft[] {
  const parsedNotes = parseNotes(value);

  if (parsedNotes.length === 0) {
    return [
      {
        id: `${idPrefix}-0`,
        value: "",
      },
    ];
  }

  return parsedNotes.map((note, index) => ({
    id: `${idPrefix}-${index.toString()}`,
    value: note,
  }));
}

/**
 * Parses persisted multiline notes into note draft values.
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

/**
 * Serializes note drafts into the newline-separated value expected by the API.
 */
function serializeNotes(notes: NoteDraft[]): string {
  return notes
    .map((note) => note.value.trim().replace(/[ \t]+/g, " "))
    .filter(Boolean)
    .join("\n");
}
