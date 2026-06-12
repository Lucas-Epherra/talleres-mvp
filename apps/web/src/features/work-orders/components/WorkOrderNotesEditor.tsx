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
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="work-order-notes-heading"
            className="text-lg font-semibold text-white"
          >
            Notas internas
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Agregá observaciones internas separadas para que sean fáciles de
            leer en el historial.
          </p>
        </div>

        <p className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
          {notes.filter((note) => note.value.trim()).length} nota
          {notes.filter((note) => note.value.trim()).length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
        <div className="hidden grid-cols-[minmax(0,1fr)_48px] border-b border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid">
          <span>Nota</span>
          <span className="sr-only">Acción</span>
        </div>

        <div className="divide-y divide-slate-800">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_48px] sm:items-start"
            >
              <div>
                <label
                  htmlFor={`note-${note.id}`}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:sr-only"
                >
                  Nota {index + 1}
                </label>

                <textarea
                  id={`note-${note.id}`}
                  value={note.value}
                  onChange={(event) => updateNote(note.id, event.target.value)}
                  rows={2}
                  placeholder="Ej: Avisar por WhatsApp antes de avanzar con repuestos extra."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400 sm:mt-0"
                />
              </div>

              <button
                type="button"
                onClick={() => removeNote(note.id)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-200 sm:px-0"
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
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
      >
        Agregar nota
      </button>
    </section>
  );
}