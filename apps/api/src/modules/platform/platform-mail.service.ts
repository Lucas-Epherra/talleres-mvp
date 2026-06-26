import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

type SendWorkshopInvitationEmailInput = {
  to: string;
  workshopName: string;
  invitationUrl: string;
  expiresAt: Date;
};

type EmailDeliveryResult = {
  sent: boolean;
  providerMessageId: string | null;
  reason: string | null;
};

/**
 * Sends platform transactional emails.
 *
 * Email delivery can be disabled in local development while still generating
 * invitation links for manual QA.
 */
@Injectable()
export class PlatformMailService {
  private readonly logger = new Logger(PlatformMailService.name);

  /**
   * Sends an invitation email for a workshop user.
   */
  async sendWorkshopInvitationEmail(
    input: SendWorkshopInvitationEmailInput,
  ): Promise<EmailDeliveryResult> {
    const shouldSendEmail = process.env.SEND_PLATFORM_INVITATION_EMAILS === 'true';
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!shouldSendEmail) {
      return {
        sent: false,
        providerMessageId: null,
        reason: 'Email delivery disabled.',
      };
    }

    if (!resendApiKey) {
      return {
        sent: false,
        providerMessageId: null,
        reason: 'RESEND_API_KEY is not configured.',
      };
    }

    if (!from) {
      return {
        sent: false,
        providerMessageId: null,
        reason: 'EMAIL_FROM is not configured.',
      };
    }

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: `Acceso a Mi Taller 360 - ${input.workshopName}`,
      html: renderWorkshopInvitationEmail(input),
    });

    if (error) {
      this.logger.error(
        `Failed to send invitation email to ${input.to}: ${JSON.stringify(
          error,
        )}`,
      );

      return {
        sent: false,
        providerMessageId: null,
        reason: 'Email provider rejected the message.',
      };
    }

    return {
      sent: true,
      providerMessageId: data?.id ?? null,
      reason: null,
    };
  }
}

/**
 * Renders the HTML email used for workshop invitations.
 */
function renderWorkshopInvitationEmail(
  input: SendWorkshopInvitationEmailInput,
): string {
  const escapedWorkshopName = escapeHtml(input.workshopName);
  const escapedInvitationUrl = escapeHtml(input.invitationUrl);
  const expiresAt = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(input.expiresAt);

  return `
    <div style="margin:0;padding:0;background:#f4f5f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f6;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d7dde3;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="background:#080A0D;padding:24px 28px;">
                  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.04em;">
                    Mi Taller 360
                  </p>
                  <p style="margin:6px 0 0;color:#aeb7c2;font-size:12px;">
                    Todo tu taller, en un solo sistema.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 10px;color:#D62828;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;">
                    Invitación de acceso
                  </p>

                  <h1 style="margin:0;color:#111827;font-size:26px;line-height:1.2;font-weight:900;">
                    Te invitaron a ${escapedWorkshopName}
                  </h1>

                  <p style="margin:16px 0 0;color:#4b5563;font-size:15px;line-height:1.6;">
                    Creá tu acceso para ingresar al panel operativo del taller en Mi Taller 360.
                  </p>

                  <div style="margin:24px 0;">
                    <a href="${escapedInvitationUrl}" style="display:inline-block;background:#D62828;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 20px;border-radius:12px;">
                      Crear acceso
                    </a>
                  </div>

                  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                    Este link vence el ${escapeHtml(expiresAt)}.
                  </p>

                  <p style="margin:18px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                    Si el botón no funciona, copiá y pegá este link en el navegador:
                  </p>

                  <p style="margin:8px 0 0;word-break:break-all;color:#111827;font-size:13px;line-height:1.6;">
                    ${escapedInvitationUrl}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Escapes HTML-sensitive characters before interpolating dynamic values.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}