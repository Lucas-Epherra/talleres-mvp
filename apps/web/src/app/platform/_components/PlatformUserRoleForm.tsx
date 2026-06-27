"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import type { AuthRole } from "@/features/auth/types";
import { updatePlatformUserRole } from "@/features/platform/platform.client";
import type { PlatformUser } from "@/features/platform/types";
import { getApiErrorMessage } from "@/lib/api";

type PlatformUserRoleFormProps = {
  platformUser: PlatformUser;
};

const roleOptions: Array<{
  value: AuthRole;
  label: string;
}> = [
  {
    value: "OWNER",
    label: "Responsable del taller",
  },
  {
    value: "ADMIN",
    label: "Administración",
  },
  {
    value: "OPERATOR",
    label: "Operario / equipo",
  },
];

/**
 * Updates a workshop user's role from the internal platform panel.
 */
export function PlatformUserRoleForm({
  platformUser,
}: PlatformUserRoleFormProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<AuthRole>(platformUser.role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );

  const hasChanges = selectedRole !== platformUser.role;
  const isDisabled = isSubmitting || isRefreshing || !hasChanges;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasChanges || isSubmitting || isRefreshing) {
      return;
    }

    setMessage(null);
    setMessageType(null);
    setIsSubmitting(true);

    try {
      await updatePlatformUserRole(platformUser.membershipId, {
        role: selectedRole,
      });

      setMessage("Rol actualizado.");
      setMessageType("success");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(getApiErrorMessage(error));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <label className="block text-xs font-bold text-foreground">
        Cambiar rol
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value as AuthRole)}
          className="h-10 min-w-52 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary"
        >
          {roleOptions.map((roleOption) => (
            <option key={roleOption.value} value={roleOption.value}>
              {roleOption.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {isSubmitting || isRefreshing ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {message ? (
        <p
          className={
            messageType === "success"
              ? "text-xs font-semibold leading-5 text-success"
              : "text-xs font-semibold leading-5 text-primary"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}