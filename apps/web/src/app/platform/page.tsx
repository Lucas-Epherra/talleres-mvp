import type { Metadata } from "next";
import Link from "next/link";
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
  PlatformAuditLog,
  PlatformAuditLogsResponse,
} from "@/features/platform/types";
import { ApiError, isApiErrorWithStatus } from "@/lib/api";
import { apiServerFetch } from "@/lib/api.server";
import { CreatePlatformInvitationForm } from "./_components/CreatePlatformInvitationForm";
import { CreatePlatformWorkshopForm } from "./_components/CreatePlatformWorkshopForm";
import { PlatformWorkshopArchiveButton } from "./_components/PlatformWorkshopArchiveButton";
import { PlatformWorkshopStatusButton } from "./_components/PlatformWorkshopStatusButton";
import { RevokePlatformInvitationButton } from "./_components/RevokePlatformInvitationButton";
import { ResendPlatformInvitationButton } from "./_components/ResendPlatformInvitationButton";
import { PlatformUserAccessButton } from "./_components/PlatformUserAccessButton";
import { PlatformUserRoleForm } from "./_components/PlatformUserRoleForm";
import { ArchivePlatformInvitationButton } from "./_components/ArchivePlatformInvitationButton";

export const metadata: Metadata = {
  title: "Plataforma",
};

type PlatformPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type PlatformFiltersState = {
  query: string;
  workshopStatus: PlatformWorkshop["status"] | "ALL";
  userStatus: PlatformUser["status"] | "ALL";
  invitationStatus: PlatformInvitation["status"] | "ALL";
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
export default async function PlatformPage({ searchParams }: PlatformPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const [
    platformContext,
    summary,
    workshopsPage,
    usersPage,
    invitationsPage,
    auditLogsPage,
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
    getProtectedPlatformResource<PlatformAuditLogsResponse>(
      "/platform/audit-logs",
    ),
  ]);

  const filters = parsePlatformFilters(resolvedSearchParams);
  const filteredWorkshops = filterWorkshops(workshopsPage.data, filters);
  const filteredUsers = filterUsers(usersPage.data, filters);
  const filteredInvitations = filterInvitations(
    invitationsPage.data,
    filters,
  );

  const hasActiveFilters = hasPlatformActiveFilters(filters);
  const activeWorkshopsForInvitations = workshopsPage.data.filter(
    (workshop) => workshop.status === "ACTIVE",
  );


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
            description={`${summary.workshops.active} activos · ${summary.workshops.disabled} suspendidos · ${summary.workshops.archived} archivados`} icon={
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

        <PlatformFilters
          filters={filters}
          hasActiveFilters={hasActiveFilters}
        />


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
                  {filteredWorkshops.length} de {workshopsPage.data.length}
                </span>
              </div>

              {filteredWorkshops.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {filteredWorkshops.map((workshop) => (
                    <WorkshopCard key={workshop.id} workshop={workshop} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
                  No hay talleres que coincidan con los filtros actuales.
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
                  {filteredUsers.length} de {usersPage.data.length}
                </span>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {filteredUsers.map((platformUser) => (
                    <PlatformUserCard
                      key={platformUser.membershipId}
                      platformUser={platformUser}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
                  No hay usuarios que coincidan con los filtros actuales.
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
                  {filteredInvitations.length} de {invitationsPage.data.length}
                </span>
              </div>

              {filteredInvitations.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {filteredInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
                  No hay invitaciones que coincidan con los filtros actuales.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <CreatePlatformWorkshopForm />
            </section>

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <CreatePlatformInvitationForm workshops={activeWorkshopsForInvitations} />
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

            <section className="rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Actividad reciente
              </p>

              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
                Auditoría
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Últimas acciones realizadas desde el panel interno.
              </p>

              {auditLogsPage.data.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {auditLogsPage.data.slice(0, 8).map((auditLog) => (
                    <AuditLogCard key={auditLog.id} auditLog={auditLog} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-4 text-sm leading-6 text-muted-foreground">
                  Todavía no hay actividad registrada.
                </p>
              )}
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

type PlatformFiltersProps = {
  filters: PlatformFiltersState;
  hasActiveFilters: boolean;
};

/**
 * Renders platform search and status filters.
 */
function PlatformFilters({
  filters,
  hasActiveFilters,
}: PlatformFiltersProps) {
  return (
    <section className="mt-5 rounded-[1.35rem] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Búsqueda y filtros
        </p>

        <h2 className="font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground">
          Encontrar datos rápido
        </h2>

        <p className="text-sm leading-6 text-muted-foreground">
          Filtrá talleres, usuarios e invitaciones sin salir del panel interno.
        </p>
      </div>

      <form
        action="/platform"
        className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_12rem_13rem_auto]"
      >
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-foreground">Buscar</span>
          <input
            name="q"
            defaultValue={filters.query}
            placeholder="Taller, email, usuario o código..."
            className="h-11 w-full rounded-xl border border-border bg-surface-muted px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold text-foreground">Talleres</span>
          <select
            name="workshopStatus"
            defaultValue={filters.workshopStatus}
            className="h-11 w-full rounded-xl border border-border bg-surface-muted px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="DISABLED">Suspendidos</option>
            <option value="ARCHIVED">Archivados</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold text-foreground">Usuarios</span>
          <select
            name="userStatus"
            defaultValue={filters.userStatus}
            className="h-11 w-full rounded-xl border border-border bg-surface-muted px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Acceso activo</option>
            <option value="DISABLED">Deshabilitados</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold text-foreground">
            Invitaciones
          </span>
          <select
            name="invitationStatus"
            defaultValue={filters.invitationStatus}
            className="h-11 w-full rounded-xl border border-border bg-surface-muted px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary"
          >
            <option value="ALL">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="ACCEPTED">Aceptadas</option>
            <option value="REVOKED">Revocadas</option>
            <option value="EXPIRED">Vencidas</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 lg:justify-end">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            Aplicar
          </button>

          {hasActiveFilters ? (
            <Link
              href="/platform"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60"
            >
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>
    </section>
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

        <div className="flex flex-col gap-3 lg:items-end">
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

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
            <Link
              href={`/platform/workshops/${workshop.id}`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Ver detalle
            </Link>

            <PlatformWorkshopStatusButton workshop={workshop} />
            <PlatformWorkshopArchiveButton workshop={workshop} />
          </div>
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

type WorkshopStatusBadgeProps = {
  status: PlatformWorkshop["status"];
};

/**
 * Renders a workshop status badge.
 */
function WorkshopStatusBadge({ status }: WorkshopStatusBadgeProps) {
  const statusLabelMap: Record<PlatformWorkshop["status"], string> = {
    ACTIVE: "Activo",
    DISABLED: "Suspendido",
    ARCHIVED: "Archivado",
  };

  const classNameMap: Record<PlatformWorkshop["status"], string> = {
    ACTIVE: "border-success/30 bg-success/10 text-success",
    DISABLED: "border-primary/30 bg-primary/10 text-primary",
    ARCHIVED: "border-border-strong bg-surface text-muted-foreground",
  };

  return (
    <span
      className={`${classNameMap[status]} rounded-full border px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em]`}
    >
      {statusLabelMap[status]}
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
 * Determines if an invitation can be archived.
 */
function canArchiveInvitation(status: PlatformInvitation["status"]): boolean {
  return status === "REVOKED" || status === "EXPIRED";
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
 * Parses platform filters from URL search params.
 */
function parsePlatformFilters(
  searchParams: Record<string, string | string[] | undefined>,
): PlatformFiltersState {
  return {
    query: getSearchParamValue(searchParams.q).trim(),
    workshopStatus: getValidatedSearchOption(
      getSearchParamValue(searchParams.workshopStatus),
      ["ALL", "ACTIVE", "DISABLED", "ARCHIVED"] as const,
      "ALL",
    ),
    userStatus: getValidatedSearchOption(
      getSearchParamValue(searchParams.userStatus),
      ["ALL", "ACTIVE", "DISABLED"] as const,
      "ALL",
    ),
    invitationStatus: getValidatedSearchOption(
      getSearchParamValue(searchParams.invitationStatus),
      ["ALL", "PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const,
      "ALL",
    ),
  };
}

/**
 * Filters workshops by text and status.
 */
function filterWorkshops(
  workshops: PlatformWorkshop[],
  filters: PlatformFiltersState,
): PlatformWorkshop[] {
  return workshops.filter((workshop) => {
    if (
      filters.workshopStatus !== "ALL" &&
      workshop.status !== filters.workshopStatus
    ) {
      return false;
    }

    return matchesPlatformQuery(
      [workshop.name, workshop.slug, workshop.status],
      filters.query,
    );
  });
}

/**
 * Filters platform users by text and access status.
 */
function filterUsers(
  users: PlatformUser[],
  filters: PlatformFiltersState,
): PlatformUser[] {
  return users.filter((platformUser) => {
    if (
      filters.userStatus !== "ALL" &&
      platformUser.status !== filters.userStatus
    ) {
      return false;
    }

    return matchesPlatformQuery(
      [
        platformUser.user.name,
        platformUser.user.email,
        platformUser.status,
        platformUser.workshop.name,
        platformUser.workshop.slug,
        formatPlatformUserRole(platformUser.role),
      ],
      filters.query,
    );
  });
}

/**
 * Filters invitations by text and invitation status.
 */
function filterInvitations(
  invitations: PlatformInvitation[],
  filters: PlatformFiltersState,
): PlatformInvitation[] {
  return invitations.filter((invitation) => {
    if (
      filters.invitationStatus !== "ALL" &&
      invitation.status !== filters.invitationStatus
    ) {
      return false;
    }

    return matchesPlatformQuery(
      [
        invitation.email,
        invitation.status,
        invitation.workshop.name,
        invitation.workshop.slug,
        formatInvitationRole(invitation.role),
      ],
      filters.query,
    );
  });
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

      {auditLog.workshop ? (
        <p className="mt-1 wrap-anywhere text-xs font-semibold leading-5 text-muted-foreground">
          Taller: {auditLog.workshop.name}
        </p>
      ) : null}
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

/**
 * Determines if any platform filter is active.
 */
function hasPlatformActiveFilters(filters: PlatformFiltersState): boolean {
  return (
    filters.query.length > 0 ||
    filters.workshopStatus !== "ALL" ||
    filters.userStatus !== "ALL" ||
    filters.invitationStatus !== "ALL"
  );
}

/**
 * Returns the first string value from a URL search param.
 */
function getSearchParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

/**
 * Keeps only expected URL filter values.
 */
function getValidatedSearchOption<TOption extends string>(
  value: string,
  validOptions: readonly TOption[],
  fallback: TOption,
): TOption {
  return validOptions.includes(value as TOption)
    ? (value as TOption)
    : fallback;
}

/**
 * Matches a search query against multiple fields.
 */
function matchesPlatformQuery(fields: string[], query: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizePlatformSearchValue(query);

  return fields.some((field) =>
    normalizePlatformSearchValue(field).includes(normalizedQuery),
  );
}

/**
 * Normalizes text for accent-insensitive platform search.
 */
function normalizePlatformSearchValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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