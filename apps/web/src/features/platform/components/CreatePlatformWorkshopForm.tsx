"use client";

import { Building2, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { createPlatformWorkshop } from "@/features/platform/platform.client";
import { getApiErrorMessage } from "@/lib/api";

type FormStatus = "idle" | "loading" | "success" | "error";

type CreatePlatformWorkshopFormState = {
  status: FormStatus;
  message: string | null;
};

const INTERNAL_CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Client-side form used by platform administrators to create workshop accounts.
 *
 * It keeps the mutation isolated in a leaf Client Component while the platform
 * page remains server-rendered.
 */
export function CreatePlatformWorkshopForm() {
  const router = useRouter();
  const feedbackId = useId();

  const [state, setState] = useState<CreatePlatformWorkshopFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase();

    if (name.length < 3) {
      setState({
        status: "error",
        message: "El nombre del taller debe tener al menos 3 caracteres.",
      });

      return;
    }

    if (slug && !INTERNAL_CODE_PATTERN.test(slug)) {
      setState({
        status: "error",
        message:
          "El código corto solo puede usar minúsculas, números y guiones simples.",
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
    });

    try {
      await createPlatformWorkshop({
        name,
        ...(slug ? { slug } : {}),
      });

      form.reset();

      setState({
        status: "success",
        message: "Taller creado correctamente.",
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
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? feedbackId : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface">
          <Building2 className="size-4 text-primary" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h2 className="font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
            Crear taller
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Creá un taller nuevo dentro de Mi Taller 360. El acceso para el
            responsable se configura en el siguiente paso.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="platform-workshop-name"
          className="block text-sm font-bold text-foreground"
        >
          Nombre del taller
        </label>

        <input
          id="platform-workshop-name"
          name="name"
          type="text"
          minLength={3}
          maxLength={120}
          placeholder="Ej: Taller San Martín"
          className="h-11 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="platform-workshop-slug"
          className="block text-sm font-bold text-foreground"
        >
          Código corto opcional
        </label>

        <input
          id="platform-workshop-slug"
          name="slug"
          type="text"
          minLength={3}
          maxLength={80}
          placeholder="taller-san-martin"
          className="h-11 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        />

        <p className="text-xs leading-5 text-muted-foreground">
          Se usa internamente para identificar el taller. Si lo dejás vacío, el
          sistema lo genera solo.
        </p>
      </div>

      {state.message ? (
        <p
          id={feedbackId}
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "success"
              ? "rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
              : "rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}

        {isLoading ? "Creando taller..." : "Crear taller"}
      </button>
    </form>
  );
}