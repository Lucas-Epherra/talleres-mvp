import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  MailPlus,
  Users,
  Wrench,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import type {
  PlatformInvitation,
  PlatformMeResponse,
  PlatformUser,
  PlatformWorkshop,
  PlatformWorkshopDetailResponse,
  PlatformAuditLog,
} from "@/features/platform/types";
import { ApiError, isApiErrorWithStatus } from "@/lib/api";
import { apiServerFetch } from "@/lib/api.server";
import { ArchivePlatformInvitationButton } from "../../_components/ArchivePlatformInvitationButton";
import { CreatePlatformInvitationForm } from "../../_components/CreatePlatformInvitationForm";
import { PlatformUserAccessButton } from "../../_components/PlatformUserAccessButton";
import { PlatformUserRoleForm } from "../../_components/PlatformUserRoleForm";
import { PlatformWorkshopStatusButton } from "../../_components/PlatformWorkshopStatusButton";
import { ResendPlatformInvitationButton } from "../../_components/ResendPlatformInvitationButton";
import { RevokePlatformInvitationButton } from "../../_components/RevokePlatformInvitationButton";

export const metadata: Metadata = {
  title: "Detalle del taller",
};

type PlatformWorkshopDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Fetches a protected platform resource.
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

    if (isApiErrorWithStatus(error, 404)) {
      notFound();
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw error;
  }
}

/**
 * Platform workshop detail page.
 */
export default async function PlatformWorkshopDetailPage({
  params,
}: PlatformWorkshopDetailPageProps) {
  const { id } = await params;

  const [platformContext, detailPage] = await Promise.all([
    getProtectedPlatformResource<PlatformMeResponse>("/platform/me"),
    getProtectedPlatformResource<PlatformWorkshopDetailResponse>(
      `/platform/workshops/${id}`,
    ),
  ]);

  const { workshop, users, invitations, auditLogs } = detailPage.data;
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

      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:py-7">
        <div className="mb-5">
          <Link
            href="/platform"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
          >
            <ArrowLeft className="size-4 text-primary" aria-hidden="true" />
            Volver a plataforma
          </Link>
        </div>

        <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Detalle del taller
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="wrap-anywhere font-display text-3xl font-black uppercase tracking-[0.04em] text-foreground sm:text-4xl">
                  {workshop.name}
                </h1>

                <WorkshopStatusBadge status={workshop.status} />
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Código interno:{" "}
                <span className="font-semibold text-foreground">
                  {workshop.slug}
                </span>
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Creado: {formatPlatformDate(workshop.createdAt)} · Actualizado:{" "}
                {formatPlatformDate(workshop.updatedAt)}
              </p>
            </div>

            <PlatformWorkshopStatusButton workshop={workshop} />
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <WorkshopMetricCard
            title="Miembros"
            value={workshop.counts.members}
            icon={<Users className="size-4 text-primary" aria-hidden="true" />}
          />

          <WorkshopMetricCard
            title="Clientes"
            value={workshop.counts.customers}
            icon={<Users className="size-4 text-primary" aria-hidden="true" />}
          />

          <WorkshopMetricCard
            title="Vehículos"
            value={workshop.counts.vehicles}
            icon={
              <Building2 className="size-4 text-primary" aria-hidden="true" />
            }
          />

          <WorkshopMetricCard
            title="Órdenes"
            value={workshop.counts.workOrders}
            icon={<Wrench className="size-4 text-primary" aria-hidden="true" />}
          />

          <WorkshopMetricCard
            title="Turnos"
            value={workshop.counts.appointments}
            icon={
              <CalendarDays
                className="size-4 text-primary"
                aria-hidden="true"
              />
            }
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <SectionHeader
                eyebrow="Equipo"
                title="Usuarios del taller"
                description="Personas con acceso a esta cuenta de taller."
                badge={`${users.length} usuarios`}
                icon={<Users className="size-3.5" aria-hidden="true" />}
              />

              {users.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {users.map((platformUser) => (
                    <PlatformUserCard
                      key={platformUser.membershipId}
                      platformUser={platformUser}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Este taller todavía no tiene usuarios registrados." />
              )}
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <SectionHeader
                eyebrow="Invitaciones"
                title="Accesos enviados"
                description="Invitaciones activas o históricas no archivadas para este taller."
                badge={`${invitations.length} registros`}
                icon={<MailPlus className="size-3.5" aria-hidden="true" />}
              />

              {invitations.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {invitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Este taller no tiene invitaciones visibles." />
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <CreatePlatformInvitationForm workshops={[workshop]} />
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Estado de cuenta
              </p>

              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                Administración
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Desde acá podés suspender o reactivar este taller sin borrar sus
                clientes, vehículos, órdenes ni usuarios.
              </p>

              <div className="mt-5">
                <PlatformWorkshopStatusButton workshop={workshop} />
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Resumen operativo
              </p>

              <div className="mt-5 space-y-3">
                <SideInfo label="Código interno" value={workshop.slug} />
                <SideInfo
                  label="Estado"
                  value={workshop.status === "ACTIVE" ? "Activo" : "Suspendido"}
                />
                <SideInfo
                  label="Usuarios visibles"
                  value={users.length.toString()}
                />
                <SideInfo
                  label="Invitaciones visibles"
                  value={invitations.length.toString()}
                />
              </div>
            </section>
            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Actividad del taller
              </p>

              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                Auditoría
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Últimas acciones internas relacionadas con este taller.
              </p>

              {auditLogs.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {auditLogs.map((auditLog) => (
                    <AuditLogCard key={auditLog.id} auditLog={auditLog} />
                  ))}
                </div>
              ) : (
                <EmptyState message="Este taller todavía no tiene actividad interna registrada." />
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

type WorkshopMetricCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
};

/**
 * Compact metric card for workshop detail.
 */
function WorkshopMetricCard({ title, value, icon }: WorkshopMetricCardProps) {
  return (
    <article className="rounded-[1.2rem] border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            {title}
          </p>

          <p className="mt-4 font-display text-4xl font-black tracking-[-0.04em] text-foreground">
            {value}
          </p>
        </div>

        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-muted">
          {icon}
        </span>
      </div>
    </article>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  icon: ReactNode;
};

/**
 * Shared section header.
 */
function SectionHeader({
  eyebrow,
  title,
  description,
  badge,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </p>

        <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {badge}
      </span>
    </div>
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
            Rol:{" "}
            <span className="font-semibold text-foreground">
              {formatPlatformUserRole(platformUser.role)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-80">
            <MiniInfo label="Alta" value={formatPlatformDate(platformUser.createdAt)} />
            <MiniInfo label="Taller" value={platformUser.workshop.slug} />
            <MiniInfo label="Acceso" value={formatPlatformUserRole(platformUser.role)} />
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <PlatformUserRoleForm platformUser={platformUser} />
            <PlatformUserAccessButton platformUser={platformUser} />
          </div>
        </div>
      </div>
    </article>
  );
}

type InvitationCardProps = {
  invitation: PlatformInvitation;
};

/**
 * Renders an invitation row.
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
            Acceso:{" "}
            <span className="font-semibold text-foreground">
              {formatInvitationRole(invitation.role)}
            </span>
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Creada: {formatPlatformDate(invitation.createdAt)}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start lg:items-end">
          <MiniInfo label="Vence" value={formatPlatformDate(invitation.expiresAt)} />

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

          {canArchiveInvitation(invitation.status) ? (
            <ArchivePlatformInvitationButton
              invitationId={invitation.id}
              email={invitation.email}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

type MiniInfoProps = {
  label: string;
  value: string;
};

/**
 * Small information pill.
 */
function MiniInfo({ label, value }: MiniInfoProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-bold text-foreground">{value}</p>
    </div>
  );
}

type SideInfoProps = {
  label: string;
  value: string;
};

/**
 * Sidebar information row.
 */
function SideInfo({ label, value }: SideInfoProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 wrap-anywhere font-bold text-foreground">{value}</p>
    </div>
  );
}

type AuditLogCardProps = {
  auditLog: PlatformAuditLog;
};

/**
 * Renders a compact platform audit log row.
 */
function AuditLogCard({ auditLog }: AuditLogCardProps) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted px-3 py-3">
      <p className="text-sm font-bold leading-5 text-foreground">
        {auditLog.summary}
      </p>

      <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
        {auditLog.actorUser.name} · {formatPlatformDateTime(auditLog.createdAt)}
      </p>
    </article>
  );
}

/**
 * Formats platform date and time in a compact readable format.
 */
function formatPlatformDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

type EmptyStateProps = {
  message: string;
};

/**
 * Empty state for workshop detail sections.
 */
function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
      {message}
    </p>
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

/**
 * Determines if an invitation can be resent.
 */
function canResendInvitation(status: PlatformInvitation["status"]): boolean {
  return status === "PENDING" || status === "EXPIRED";
}

/**
 * Determines if an invitation can be archived.
 */
function canArchiveInvitation(status: PlatformInvitation["status"]): boolean {
  return status === "REVOKED" || status === "EXPIRED";
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
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}