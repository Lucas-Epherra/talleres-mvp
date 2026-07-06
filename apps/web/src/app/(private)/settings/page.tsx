import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock3,
  Mail,
  ReceiptText,
  Settings,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { WorkshopSettingsForm } from "@/features/workshop-settings/components/WorkshopSettingsForm";
import { getWorkshopSettings } from "@/features/workshop-settings/workshop-settings.server";

export const metadata: Metadata = {
  title: "Configuración del taller",
};

/**
 * Workshop settings page.
 *
 * This Server Component fetches the authenticated workshop settings and leaves
 * the interactive mutation state to WorkshopSettingsForm.
 */
export default async function SettingsPage() {
  const response = await getWorkshopSettings();
  const settings = response.data;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-white via-surface to-surface-muted p-6 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-20 size-56 rounded-full bg-primary/8 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              Volver al panel
            </Link>

            <p className="mt-6 text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
              Configuración
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Datos del taller
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Administrá la identidad básica del taller. Estos datos van a
              usarse como base para recibos internos, emails y futuras
              comunicaciones con clientes.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl border border-border-strong bg-surface-muted">
                <Settings className="size-5 text-primary" aria-hidden="true" />
              </span>

              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Última actualización
                </p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {formatDateTime(settings.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        aria-label="Usos de la configuración"
        className="grid gap-4 md:grid-cols-3"
      >
        <InfoCard
          icon={ReceiptText}
          title="Recibos internos"
          description="El próximo paso es usar estos datos en el encabezado del PDF."
        />

        <InfoCard
          icon={Mail}
          title="Emails"
          description="También van a servir como referencia para emails enviados al cliente."
        />

        <InfoCard
          icon={Clock3}
          title="Horarios"
          description="Ayudan a ordenar futuras plantillas, recordatorios y perfil del taller."
        />
      </section>

      <WorkshopSettingsForm settings={settings} />
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-border bg-white/96 p-5 shadow-(--shadow-industrial) ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-sm">
      <span className="grid size-10 place-items-center rounded-2xl border border-primary/20 bg-primary/8 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <h2 className="mt-4 font-display text-sm font-black uppercase tracking-[0.04em] text-foreground">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}