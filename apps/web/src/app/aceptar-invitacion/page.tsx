import type { Metadata } from "next";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { PlatformInvitationAcceptanceResponse } from "@/features/platform/types";
import { ApiError } from "@/lib/api";
import { apiServerFetch } from "@/lib/api.server";
import { AcceptInvitationForm } from "./_components/AcceptInvitationForm";

type AcceptInvitationPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Aceptar invitación",
};

/**
 * Public invitation acceptance page.
 */
export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token?.trim();

  if (!token) {
    return <InvalidInvitationScreen message="El link de invitación no es válido." />;
  }

  const invitation = await getInvitationAcceptance(token);

  if (!invitation) {
    return (
      <InvalidInvitationScreen message="La invitación venció, fue usada o ya no está disponible." />
    );
  }

  return (
    <main className="theme-light flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="w-full max-w-xl rounded-[1.35rem] border border-border bg-surface p-6 sm:p-8">
        <div className="mb-8 flex justify-center">
          <BrandLogo
            variant="light"
            priority
            className="block h-auto w-[260px] object-contain sm:w-[320px]"
          />
        </div>

        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Alta de usuario
        </p>

        <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.04em] text-foreground">
          Crear acceso
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Completá tus datos para entrar al taller en Mi Taller 360.
        </p>

        <div className="mt-7">
          <AcceptInvitationForm
            token={token}
            email={invitation.data.email}
            workshopName={invitation.data.workshop.name}
          />
        </div>
      </section>
    </main>
  );
}

/**
 * Reads invitation details from the backend before rendering the form.
 */
async function getInvitationAcceptance(
  token: string,
): Promise<PlatformInvitationAcceptanceResponse | null> {
  try {
    return await apiServerFetch<PlatformInvitationAcceptanceResponse>(
      `/invitations/acceptance?token=${encodeURIComponent(token)}`,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }

    throw error;
  }
}

/**
 * Renders a safe message for invalid invitation links.
 */
function InvalidInvitationScreen({ message }: { message: string }) {
  return (
    <main className="theme-light flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="w-full max-w-lg rounded-[1.35rem] border border-border bg-surface p-6 text-center sm:p-8">
        <div className="mb-8 flex justify-center">
          <BrandLogo
            variant="light"
            priority
            className="block h-auto w-[260px] object-contain"
          />
        </div>

        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Invitación no disponible
        </p>

        <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.04em] text-foreground">
          No pudimos abrir este acceso
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
      </section>
    </main>
  );
}