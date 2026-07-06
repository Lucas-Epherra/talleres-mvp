"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Trash2, UploadCloud } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import {
  deleteWorkshopLogo,
  updateWorkshopSettings,
  uploadWorkshopLogo,
} from "../workshop-settings.client";
import type {
  UpdateWorkshopSettingsInput,
  WorkshopSettings,
} from "../types";

type WorkshopSettingsFormProps = {
  settings: WorkshopSettings;
};

type FormDraft = {
  name: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  description: string;
};

type FormStatus = "idle" | "loading" | "success" | "error";

type FormState = {
  status: FormStatus;
  message: string | null;
};

type LogoState = {
  status: FormStatus;
  message: string | null;
};

type TextFieldProps = {
  id: string;
  name: keyof FormDraft;
  label: string;
  value: string;
  helper?: string;
  required?: boolean;
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  maxLength?: number;
  onChange: (field: keyof FormDraft, value: string) => void;
};

type TextAreaFieldProps = {
  id: string;
  name: keyof FormDraft;
  label: string;
  value: string;
  helper?: string;
  rows: number;
  maxLength: number;
  onChange: (field: keyof FormDraft, value: string) => void;
};

const FIELD_LIMITS = {
  name: 120,
  phone: 40,
  email: 160,
  address: 180,
  businessHours: 700,
  description: 500,
} as const;

const MAX_LOGO_UPLOAD_BYTES = 1024 * 1024;
const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/**
 * Editable workshop settings form.
 *
 * This is a leaf Client Component because it owns submit state, logo upload
 * state, client-side validation, accessible feedback and the live preview.
 */
export function WorkshopSettingsForm({ settings }: WorkshopSettingsFormProps) {
  const router = useRouter();
  const formId = useId();
  const feedbackId = useId();
  const logoFeedbackId = useId();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<FormDraft>(() =>
    buildInitialDraft(settings),
  );
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: null,
  });
  const [logoState, setLogoState] = useState<LogoState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";
  const isLogoLoading = logoState.status === "loading";

  function handleFieldChange(field: keyof FormDraft, value: string): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));

    if (state.status !== "idle") {
      setState({
        status: "idle",
        message: null,
      });
    }
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;

    setSelectedLogo(file);

    if (logoState.status !== "idle") {
      setLogoState({
        status: "idle",
        message: null,
      });
    }
  }

  async function handleUploadLogo() {
    if (isLogoLoading) {
      return;
    }

    const file = selectedLogo;
    const validationMessage = validateLogoFile(file);

    if (validationMessage) {
      setLogoState({
        status: "error",
        message: validationMessage,
      });

      return;
    }

    if (!file) {
      return;
    }

    try {
      setLogoState({
        status: "loading",
        message: null,
      });

      const response = await uploadWorkshopLogo(file);

      setLogoUrl(response.data.logoUrl);
      setSelectedLogo(null);

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      setLogoState({
        status: "success",
        message: "Logo actualizado correctamente.",
      });

      router.refresh();
    } catch (error) {
      setLogoState({
        status: "error",
        message: getApiErrorMessage(error),
      });
    }
  }

  async function handleDeleteLogo() {
    if (isLogoLoading || !logoUrl) {
      return;
    }

    try {
      setLogoState({
        status: "loading",
        message: null,
      });

      const response = await deleteWorkshopLogo();

      setLogoUrl(response.data.logoUrl);
      setSelectedLogo(null);

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      setLogoState({
        status: "success",
        message: "Logo eliminado correctamente.",
      });

      router.refresh();
    } catch (error) {
      setLogoState({
        status: "error",
        message: getApiErrorMessage(error),
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const validationMessage = validateWorkshopSettingsDraft(draft);

    if (validationMessage) {
      setState({
        status: "error",
        message: validationMessage,
      });

      return;
    }

    const input = buildUpdateWorkshopSettingsInput(draft);

    try {
      setState({
        status: "loading",
        message: null,
      });

      const response = await updateWorkshopSettings(input);

      setDraft(buildInitialDraft(response.data));
      setLogoUrl(response.data.logoUrl);
      setState({
        status: "success",
        message: "Los datos del taller se guardaron correctamente.",
      });

      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getApiErrorMessage(error),
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
      <form
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={state.message ? feedbackId : undefined}
      >
        <section
          aria-labelledby={`${formId}-identity-heading`}
          className="rounded-[1.35rem] border border-border bg-white/96 p-5 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-6"
        >
          <div className="border-b border-border pb-5">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
              Identidad
            </p>

            <h2
              id={`${formId}-identity-heading`}
              className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
            >
              Datos principales
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Estos datos identifican al taller dentro del sistema y se van a
              reutilizar en recibos, emails y futuras plantillas.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField
              id={`${formId}-name`}
              name="name"
              label="Nombre del taller"
              value={draft.name}
              required
              autoComplete="organization"
              maxLength={FIELD_LIMITS.name}
              helper="Ejemplo: Mi Taller 360"
              onChange={handleFieldChange}
            />

            <TextField
              id={`${formId}-phone`}
              name="phone"
              label="Teléfono"
              value={draft.phone}
              autoComplete="tel"
              maxLength={FIELD_LIMITS.phone}
              helper="Número visible para contacto del taller."
              onChange={handleFieldChange}
            />

            <TextField
              id={`${formId}-email`}
              name="email"
              label="Email de contacto"
              value={draft.email}
              type="email"
              autoComplete="email"
              maxLength={FIELD_LIMITS.email}
              helper="Se usará como referencia de contacto."
              onChange={handleFieldChange}
            />

            <TextField
              id={`${formId}-address`}
              name="address"
              label="Dirección"
              value={draft.address}
              autoComplete="street-address"
              maxLength={FIELD_LIMITS.address}
              helper="Dirección física del taller."
              onChange={handleFieldChange}
            />
          </div>
        </section>

        <section
          aria-labelledby={`${formId}-details-heading`}
          className="rounded-[1.35rem] border border-border bg-white/96 p-5 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-6"
        >
          <div className="border-b border-border pb-5">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
              Presentación
            </p>

            <h2
              id={`${formId}-details-heading`}
              className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
            >
              Información visible
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Mantenelo simple. La prioridad es que el taller tenga datos claros
              y útiles, no una ficha comercial compleja.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <div
              aria-describedby={logoState.message ? logoFeedbackId : undefined}
              className="rounded-3xl border border-border bg-surface-muted/55 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-foreground">
                    Logo del taller
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Subí un PNG, JPG o WEBP de hasta 1 MB. El sistema lo
                    optimiza automáticamente para usarlo en la app y recibos.
                  </p>
                </div>

                <LogoPreview
                  logoUrl={logoUrl}
                  workshopName={draft.name}
                  className="sm:ml-auto"
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <input
                  id={`${formId}-logo`}
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="block w-full text-sm font-semibold text-muted-foreground file:mr-4 file:h-10 file:rounded-xl file:border-0 file:bg-white file:px-4 file:text-sm file:font-black file:text-foreground hover:file:bg-surface-elevated"
                />

                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={isLogoLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <UploadCloud className="size-4" aria-hidden="true" />
                  {isLogoLoading ? "Procesando..." : "Subir logo"}
                </button>

                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    disabled={isLogoLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-white px-4 text-sm font-black text-foreground transition hover:border-primary/45 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    <Trash2 className="size-4 text-primary" aria-hidden="true" />
                    Eliminar
                  </button>
                ) : null}
              </div>

              {selectedLogo ? (
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  Archivo seleccionado: {selectedLogo.name}
                </p>
              ) : null}

              {logoState.message ? (
                <p
                  id={logoFeedbackId}
                  role={logoState.status === "error" ? "alert" : "status"}
                  className={
                    logoState.status === "error"
                      ? "mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                      : "mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
                  }
                >
                  {logoState.message}
                </p>
              ) : null}
            </div>

            <TextAreaField
              id={`${formId}-business-hours`}
              name="businessHours"
              label="Horarios"
              value={draft.businessHours}
              rows={4}
              maxLength={FIELD_LIMITS.businessHours}
              helper="Ejemplo: Lunes a viernes de 8:00 a 17:00."
              onChange={handleFieldChange}
            />

            <TextAreaField
              id={`${formId}-description`}
              name="description"
              label="Descripción corta"
              value={draft.description}
              rows={4}
              maxLength={FIELD_LIMITS.description}
              helper="Una frase simple sobre el taller o el tipo de servicio."
              onChange={handleFieldChange}
            />
          </div>
        </section>

        {state.message ? (
          <p
            id={feedbackId}
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error"
                ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            }
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      <aside
        aria-labelledby={`${formId}-preview-heading`}
        className="h-fit rounded-[1.35rem] border border-border bg-surface-muted/60 p-5 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-6 lg:sticky lg:top-6"
      >
        <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
          Vista previa
        </p>

        <h2
          id={`${formId}-preview-heading`}
          className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
        >
          Cómo se verá el taller
        </h2>

        <div className="mt-5 rounded-3xl border border-border bg-white p-5">
          <div className="flex items-start gap-4">
            <LogoPreview logoUrl={logoUrl} workshopName={draft.name} />

            <div className="min-w-0">
              <p className="wrap-break-word font-display text-xl font-black uppercase tracking-[0.035em] text-foreground">
                {draft.name.trim() || "Nombre del taller"}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {settings.slug}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <PreviewRow label="Teléfono" value={draft.phone} />
            <PreviewRow label="Email" value={draft.email} />
            <PreviewRow label="Dirección" value={draft.address} />
            <PreviewRow label="Horarios" value={draft.businessHours} />
            <PreviewRow label="Descripción" value={draft.description} />
          </div>

          {logoUrl ? (
            <p className="mt-5 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-xs font-bold text-muted-foreground">
              Logo cargado y optimizado para usar en la app, recibos y emails.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  value,
  helper,
  required = false,
  autoComplete,
  type = "text",
  maxLength,
  onChange,
}: TextFieldProps) {
  const helperId = helper ? `${id}-helper` : undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(name, event.target.value);
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-black uppercase tracking-[0.08em] text-foreground"
      >
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onChange={handleChange}
        aria-describedby={helperId}
        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/65 focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
      />

      {helper ? (
        <p id={helperId} className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function TextAreaField({
  id,
  name,
  label,
  value,
  helper,
  rows,
  maxLength,
  onChange,
}: TextAreaFieldProps) {
  const helperId = helper ? `${id}-helper` : undefined;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    onChange(name, event.target.value);
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-black uppercase tracking-[0.08em] text-foreground"
      >
        {label}
      </label>

      <textarea
        id={id}
        name={name}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={handleChange}
        aria-describedby={helperId}
        className="mt-2 w-full resize-y rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/65 focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
      />

      <div className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-5 text-muted-foreground">
        {helper ? <p id={helperId}>{helper}</p> : <span />}

        <p aria-label={`${value.length} de ${maxLength} caracteres`}>
          {value.length}/{maxLength}
        </p>
      </div>
    </div>
  );
}

function LogoPreview({
  logoUrl,
  workshopName,
  className,
}: {
  logoUrl: string | null;
  workshopName: string;
  className?: string;
}) {
  const normalizedName = workshopName.trim();

  if (logoUrl) {
    return (
      <div
        className={[
          "grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border-strong bg-white",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <img
          src={logoUrl}
          alt={`Logo de ${normalizedName || "taller"}`}
          className="h-full w-full object-contain p-1.5"
        />
      </div>
    );
  }

  return (
    <div
      className={[
        "grid size-14 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="font-display text-lg font-black uppercase text-primary">
        {getWorkshopInitial(workshopName)}
      </span>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  const normalizedValue = value.trim();

  return (
    <div className="rounded-2xl border border-border bg-surface-muted/55 p-3">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-line wrap-break-word text-sm font-bold leading-5 text-foreground">
        {normalizedValue || "Sin cargar"}
      </p>
    </div>
  );
}

function buildInitialDraft(settings: WorkshopSettings): FormDraft {
  return {
    name: settings.name,
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    address: settings.address ?? "",
    businessHours: settings.businessHours ?? "",
    description: settings.description ?? "",
  };
}

function buildUpdateWorkshopSettingsInput(
  draft: FormDraft,
): UpdateWorkshopSettingsInput {
  return {
    name: draft.name.trim(),
    phone: normalizeNullableText(draft.phone),
    email: normalizeNullableText(draft.email),
    address: normalizeNullableText(draft.address),
    businessHours: normalizeNullableMultilineText(draft.businessHours),
    description: normalizeNullableMultilineText(draft.description),
  };
}

function validateWorkshopSettingsDraft(draft: FormDraft): string | null {
  if (!draft.name.trim()) {
    return "El nombre del taller es obligatorio.";
  }

  if (draft.name.trim().length > FIELD_LIMITS.name) {
    return `El nombre del taller no puede superar ${FIELD_LIMITS.name} caracteres.`;
  }

  if (draft.phone.trim().length > FIELD_LIMITS.phone) {
    return `El teléfono no puede superar ${FIELD_LIMITS.phone} caracteres.`;
  }

  if (draft.email.trim()) {
    if (draft.email.trim().length > FIELD_LIMITS.email) {
      return `El email no puede superar ${FIELD_LIMITS.email} caracteres.`;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      return "Ingresá un email válido.";
    }
  }

  if (draft.address.trim().length > FIELD_LIMITS.address) {
    return `La dirección no puede superar ${FIELD_LIMITS.address} caracteres.`;
  }

  if (draft.businessHours.trim().length > FIELD_LIMITS.businessHours) {
    return `Los horarios no pueden superar ${FIELD_LIMITS.businessHours} caracteres.`;
  }

  if (draft.description.trim().length > FIELD_LIMITS.description) {
    return `La descripción no puede superar ${FIELD_LIMITS.description} caracteres.`;
  }

  return null;
}

function validateLogoFile(file: File | null): string | null {
  if (!file) {
    return "Seleccioná una imagen para subir.";
  }

  if (file.size > MAX_LOGO_UPLOAD_BYTES) {
    return "El logo no puede superar 1 MB.";
  }

  if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
    return "El logo debe ser PNG, JPG, JPEG o WEBP.";
  }

  return null;
}

function normalizeNullableText(value: string): string | null {
  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : null;
}

function normalizeNullableMultilineText(value: string): string | null {
  const normalizedValue = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return normalizedValue ? normalizedValue : null;
}

function getWorkshopInitial(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "T";
  }

  return trimmedName[0]?.toUpperCase() ?? "T";
}
