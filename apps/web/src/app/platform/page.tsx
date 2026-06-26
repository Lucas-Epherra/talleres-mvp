import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  MailPlus,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import type {
  PlatformInvitation,
  PlatformInvitationsResponse,
  PlatformMeResponse,
  PlatformSummaryResponse,
  PlatformUser,
  PlatformUsersResponse,
  PlatformWorkshop,
  PlatformWorkshopsResponse,
} from "@/features/platform/types";
import { ApiError, isApiErrorWithStatus } from "@/lib/api";
import { apiServerFetch } from "@/lib/api.server";
import { CreatePlatformInvitationForm } from "./_components/CreatePlatformInvitationForm";
import { CreatePlatformWorkshopForm } from "./_components/CreatePlatformWorkshopForm";
import { RevokePlatformInvitationButton } from "./_components/RevokePlatformInvitationButton";
import { ResendPlatformInvitationButton } from "./_components/ResendPlatformInvitationButton";
import { PlatformUserAccessButton } from "./_components/PlatformUserAccessButton";

export const metadata: Metadata = {
  title: "Plataforma",
};

/**
 * Fetches a protected platform resource.
 *
 * Authorization is enforced by the backend. The frontend redirects based on the
 * HTTP status instead of trusting only local UI state.
 */
async function getProtectedPlatformResource<TResponse>(
  path: string,
): Promise<TResponse> {
  try {
    return await apiServerFetch<TResponse>(path);
  } catch (error) {
    if (isApiErrorWithStatus(error, 401)) {
      redirect("/login");
    }

    if (isApiErrorWithStatus(error, 403)) {
      redirect("/dashboard");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw error;
  }
}

/**
 * Platform administration home.
 *
 * This page is reserved for internal Mi Taller 360 administrators. It uses real
 * platform metrics and keeps administration visually aligned with the
 * operational workshop dashboard.
 */
export default async function PlatformPage() {
  const [
    platformContext,
    summary,
    workshopsPage,
    usersPage,
    invitationsPage,
  ] = await Promise.all([
    getProtectedPlatformResource<PlatformMeResponse>("/platform/me"),
    getProtectedPlatformResource<PlatformSummaryResponse>("/platform/summary"),
    getProtectedPlatformResource<PlatformWorkshopsResponse>(
      "/platform/workshops",
    ),
    getProtectedPlatformResource<PlatformUsersResponse>("/platform/users"),
    getProtectedPlatformResource<PlatformInvitationsResponse>(
      "/platform/invitations",
    ),
  ]);

  return (
    <main className="theme-light min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="theme-dark-shell border-b border-white/10 bg-[#080A0D]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-3 py-4 sm:px-6 sm:py-5">
          <BrandLogo
            variant="dark"
            priority
            className="block h-auto w-41.25 object-contain sm:w-55"
          />

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden rounded-2xl border border-white/15 bg-white/3 px-4 py-2 text-right sm:block">
              <p className="text-sm font-semibold text-foreground">
                {platformContext.user.name}
              </p>

              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Administrador interno
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-11 items-center gap-2 rounded-2xl border border-primary bg-primary px-5 text-sm font-bold text-primary-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Panel interno
            </span>

            <span className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface-muted px-5 text-sm font-bold text-foreground">
              <Building2
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Talleres
            </span>

            <span className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface-muted px-5 text-sm font-bold text-foreground">
              <Users
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Usuarios
            </span>

            <span className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface-muted px-5 text-sm font-bold text-foreground">
              <MailPlus
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Invitaciones
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:py-7">
        <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Administración de la plataforma
              </p>

              <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.04em] text-foreground sm:text-4xl">
                Panel interno
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Control interno de Mi Taller 360 para administrar talleres,
                usuarios, accesos y estado de las cuentas.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
                Sesión activa
              </p>

              <p className="mt-1 text-sm font-semibold text-foreground">
                {platformContext.user.email}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformSummaryCard
            title="Talleres"
            value={summary.workshops.total.toString()}
            description={`${summary.workshops.active} activos · ${summary.workshops.disabled} suspendidos`}
            icon={
              <Building2 className="size-4 text-primary" aria-hidden="true" />
            }
            highlighted
          />

          <PlatformSummaryCard
            title="Usuarios"
            value={summary.users.activeWorkshopMembers.toString()}
            description={`${summary.users.platformOwners} administrador interno · ${summary.users.active} usuarios activos`}
            icon={<Users className="size-4 text-primary" aria-hidden="true" />}
          />

          <PlatformSummaryCard
            title="Invitaciones"
            value={summary.invitations.pending.toString()}
            description="Accesos pendientes"
            icon={
              <MailPlus className="size-4 text-primary" aria-hidden="true" />
            }
          />

          <PlatformSummaryCard
            title="Permisos"
            value={platformContext.capabilities.length.toString()}
            description="Permisos activos"
            icon={
              <ShieldCheck
                className="size-4 text-primary"
                aria-hidden="true"
              />
            }
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Talleres registrados
                  </p>

                  <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                    Talleres de la plataforma
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Talleres cargados en Mi Taller 360 y actividad registrada en
                    cada cuenta.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <Activity className="size-3.5" aria-hidden="true" />
                  {workshopsPage.data.length} visibles
                </span>
              </div>

              {workshopsPage.data.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {workshopsPage.data.map((workshop) => (
                    <WorkshopCard key={workshop.id} workshop={workshop} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
                  Todavía no hay talleres registrados.
                </p>
              )}
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Usuarios registrados
                  </p>

                  <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                    Usuarios de la plataforma
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Personas con acceso activo o administrativo dentro de los
                    talleres cargados en Mi Taller 360.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <Users className="size-3.5" aria-hidden="true" />
                  {usersPage.data.length} usuarios
                </span>
              </div>

              {usersPage.data.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {usersPage.data.map((platformUser) => (
                    <PlatformUserCard
                      key={platformUser.membershipId}
                      platformUser={platformUser}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
                  Todavía no hay usuarios registrados en talleres.
                </p>
              )}
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Accesos pendientes
                  </p>

                  <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                    Invitaciones
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Accesos generados para responsables o equipos de talleres.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <MailPlus className="size-3.5" aria-hidden="true" />
                  {invitationsPage.data.length} registros
                </span>
              </div>

              {invitationsPage.data.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {invitationsPage.data.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
                  Todavía no hay invitaciones registradas.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <CreatePlatformWorkshopForm />
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <CreatePlatformInvitationForm workshops={workshopsPage.data} />
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Permisos habilitados
              </p>

              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                Permisos
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Esta vista solo está disponible para administradores internos de
                Mi Taller 360.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {platformContext.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

type PlatformSummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  highlighted?: boolean;
};

/**
 * Compact metric card for platform dashboard summaries.
 */
function PlatformSummaryCard({
  title,
  value,
  description,
  icon,
  highlighted = false,
}: PlatformSummaryCardProps) {
  return (
    <article
      className={
        highlighted
          ? "rounded-[1.2rem] border border-primary/25 bg-primary/10 p-5"
          : "rounded-[1.2rem] border border-border bg-surface p-5"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            {title}
          </p>

          <p className="mt-4 font-display text-4xl font-black tracking-[-0.04em] text-foreground">
            {value}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-muted">
          {icon}
        </span>
      </div>
    </article>
  );
}

type WorkshopCardProps = {
  workshop: PlatformWorkshop;
};

/**
 * Renders a platform workshop summary row.
 */
function WorkshopCard({ workshop }: WorkshopCardProps) {
  return (
    <article className="rounded-[1.1rem] border border-border bg-surface-muted p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-black uppercase text-foreground">
              {workshop.name}
            </h3>

            <WorkshopStatusBadge status={workshop.status} />
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Código interno:{" "}
            <span className="font-semibold text-foreground">
              {workshop.slug}
            </span>
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Creado: {formatPlatformDate(workshop.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:w-md">
          <WorkshopMiniMetric
            label="Miembros"
            value={workshop.counts.members}
            icon={<Users className="size-3.5" aria-hidden="true" />}
          />

          <WorkshopMiniMetric
            label="Clientes"
            value={workshop.counts.customers}
            icon={<Users className="size-3.5" aria-hidden="true" />}
          />

          <WorkshopMiniMetric
            label="Vehículos"
            value={workshop.counts.vehicles}
            icon={<Building2 className="size-3.5" aria-hidden="true" />}
          />

          <WorkshopMiniMetric
            label="Órdenes"
            value={workshop.counts.workOrders}
            icon={<Wrench className="size-3.5" aria-hidden="true" />}
          />

          <WorkshopMiniMetric
            label="Turnos"
            value={workshop.counts.appointments}
            icon={<CalendarDays className="size-3.5" aria-hidden="true" />}
          />
        </div>
      </div>
    </article>
  );
}

type PlatformUserCardProps = {
  platformUser: PlatformUser;
};

/**
 * Renders a platform workshop user row.
 */
function PlatformUserCard({ platformUser }: PlatformUserCardProps) {
  return (
    <article className="rounded-[1.1rem] border border-border bg-surface-muted p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="wrap-anywhere font-display text-lg font-black text-foreground">
              {platformUser.user.name}
            </h3>

            <PlatformUserStatusBadge status={platformUser.status} />

          </div>

          <p className="mt-1 wrap-anywhere text-sm font-semibold text-foreground">
            {platformUser.user.email}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Taller:{" "}
            <span className="font-semibold text-foreground">
              {platformUser.workshop.name}
            </span>
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Rol:{" "}
            <span className="font-semibold text-foreground">
              {formatPlatformUserRole(platformUser.role)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-80">
            <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
              <p className="font-semibold text-muted-foreground">Alta</p>
              <p className="mt-1 font-bold text-foreground">
                {formatPlatformDate(platformUser.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
              <p className="font-semibold text-muted-foreground">Taller</p>
              <p className="mt-1 truncate font-bold text-foreground">
                {platformUser.workshop.slug}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
              <p className="font-semibold text-muted-foreground">Acceso</p>
              <p className="mt-1 font-bold text-foreground">
                {formatPlatformUserRole(platformUser.role)}
              </p>
            </div>
          </div>

          <PlatformUserAccessButton platformUser={platformUser} />
        </div>
      </div>
    </article>
  );
}

type InvitationCardProps = {
  invitation: PlatformInvitation;
};

/**
 * Renders a pending or historical invitation row.
 */
function InvitationCard({ invitation }: InvitationCardProps) {
  return (
    <article className="rounded-[1.1rem] border border-border bg-surface-muted p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="wrap-anywhere font-display text-lg font-black text-foreground">
              {invitation.email}
            </h3>

            <InvitationStatusBadge status={invitation.status} />
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Taller:{" "}
            <span className="font-semibold text-foreground">
              {invitation.workshop.name}
            </span>
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Acceso:{" "}
            <span className="font-semibold text-foreground">
              {formatInvitationRole(invitation.role)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start lg:items-end">
          <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
            <p className="font-semibold text-muted-foreground">Vence</p>
            <p className="mt-1 font-bold text-foreground">
              {formatPlatformDate(invitation.expiresAt)}
            </p>
          </div>

          {canResendInvitation(invitation.status) ? (
            <ResendPlatformInvitationButton
              invitationId={invitation.id}
              email={invitation.email}
            />
          ) : null}

          {invitation.status === "PENDING" ? (
            <RevokePlatformInvitationButton
              invitationId={invitation.id}
              email={invitation.email}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

type WorkshopStatusBadgeProps = {
  status: PlatformWorkshop["status"];
};

/**
 * Renders a workshop status badge.
 */
function WorkshopStatusBadge({ status }: WorkshopStatusBadgeProps) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={
        isActive
          ? "rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-success"
          : "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-primary"
      }
    >
      {isActive ? "Activo" : "Suspendido"}
    </span>
  );
}

type InvitationStatusBadgeProps = {
  status: PlatformInvitation["status"];
};

/**
 * Renders an invitation status badge.
 */
function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  const statusLabelMap: Record<PlatformInvitation["status"], string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REVOKED: "Revocada",
    EXPIRED: "Vencida",
  };

  const classNameMap: Record<PlatformInvitation["status"], string> = {
    PENDING: "border-primary/30 bg-primary/10 text-primary",
    ACCEPTED: "border-success/30 bg-success/10 text-success",
    REVOKED: "border-border-strong bg-surface text-muted-foreground",
    EXPIRED: "border-border-strong bg-surface text-muted-foreground",
  };

  return (
    <span
      className={`${classNameMap[status]} rounded-full border px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em]`}
    >
      {statusLabelMap[status]}
    </span>
  );
}

type PlatformUserStatusBadgeProps = {
  status: PlatformUser["status"];
};

/**
 * Renders the workshop access status badge.
 */
function PlatformUserStatusBadge({ status }: PlatformUserStatusBadgeProps) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={
        isActive
          ? "rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-success"
          : "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-primary"
      }
    >
      {isActive ? "Acceso activo" : "Acceso deshabilitado"}
    </span>
  );
}

type WorkshopMiniMetricProps = {
  label: string;
  value: number;
  icon: ReactNode;
};

/**
 * Determines if an invitation can be resent.
 */
function canResendInvitation(status: PlatformInvitation["status"]): boolean {
  return status === "PENDING" || status === "EXPIRED";
}

/**
 * Small metric used inside each workshop row.
 */
function WorkshopMiniMetric({ label, value, icon }: WorkshopMiniMetricProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-1.5 text-primary">{icon}</div>

      <p className="mt-1 font-display text-xl font-black text-foreground">
        {value}
      </p>

      <p className="text-[0.68rem] font-semibold text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/**
 * Formats workshop roles into product-facing labels.
 */
function formatInvitationRole(role: PlatformInvitation["role"]): string {
  const roleLabelMap: Record<PlatformInvitation["role"], string> = {
    OWNER: "Responsable del taller",
    ADMIN: "Administración",
    OPERATOR: "Operario / equipo",
  };

  return roleLabelMap[role];
}

/**
 * Formats platform user roles into product-facing labels.
 */
function formatPlatformUserRole(role: PlatformUser["role"]): string {
  const roleLabelMap: Record<PlatformUser["role"], string> = {
    OWNER: "Responsable del taller",
    ADMIN: "Administración",
    OPERATOR: "Operario / equipo",
  };

  return roleLabelMap[role];
}

/**
 * Formats platform dates in a compact readable format.
 */
function formatPlatformDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
  }).format(new Date(value));
}