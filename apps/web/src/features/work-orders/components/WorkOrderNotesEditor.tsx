"use client";

import {
  createEmptyWorkOrderNote,
  type WorkOrderNoteDraft,
} from "../utils/work-order-form";

type WorkOrderNotesEditorProps = {
  notes: WorkOrderNoteDraft[];
  onChange: (notes: WorkOrderNoteDraft[]) => void;
};

/**
 * Editable internal notes list for work order forms.
 *
 * Notes are captured as separate compact rows and serialized as a bullet list
 * before sending the payload to the API.
 */
export function WorkOrderNotesEditor({
  notes,
  onChange,
}: WorkOrderNotesEditorProps) {
  const notesCount = notes.filter((note) => note.value.trim()).length;

  function updateNote(noteId: string, value: string) {
    onChange(
      notes.map((note) =>
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
    onChange([...notes, createEmptyWorkOrderNote()]);
  }

  function removeNote(noteId: string) {
    if (notes.length === 1) {
      onChange([createEmptyWorkOrderNote()]);
      return;
    }

    onChange(notes.filter((note) => note.id !== noteId));
  }

  return (
    <section
      aria-labelledby="work-order-notes-heading"
      className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Historial interno
          </p>

          <h2
            id="work-order-notes-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
          >
            Notas internas
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Agregá observaciones internas separadas para que sean fáciles de
            leer en el historial operativo.
          </p>
        </div>

        <p className="w-fit rounded-full border border-border-strong bg-background/55 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
          {notesCount} nota{notesCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background/35">
        <div className="hidden grid-cols-[minmax(0,1fr)_48px] border-b border-border bg-background/70 px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:grid">
          <span>Nota</span>
          <span className="sr-only">Acción</span>
        </div>

        <div className="divide-y divide-border">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_48px] sm:items-start"
            >
              <div>
                <label
                  htmlFor={`note-${note.id}`}
                  className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:sr-only"
                >
                  Nota {index + 1}
                </label>

                <textarea
                  id={`note-${note.id}`}
                  value={note.value}
                  onChange={(event) => updateNote(note.id, event.target.value)}
                  rows={2}
                  placeholder="Ej: Avisar por WhatsApp antes de avanzar con repuestos extra."
                  className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 sm:mt-0"
                />
              </div>

              <button
                type="button"
                onClick={() => removeNote(note.id)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-lg font-black text-white transition hover:border-primary/60 hover:bg-primary/10 sm:px-0"
                aria-label={`Quitar nota ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={addNote}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
      >
        Agregar nota
      </button>
    </section>
  );
}