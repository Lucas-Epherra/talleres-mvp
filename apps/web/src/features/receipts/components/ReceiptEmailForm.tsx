"use client";

import { MailCheck, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { sendReceiptByEmail } from "../receipts.client";

type ReceiptEmailFormProps = {
  receiptId: string;
  defaultEmail: string | null;
};

/**
 * Sends a generated receipt by email using the backend Resend integration.
 */
export function ReceiptEmailForm({
  receiptId,
  defaultEmail,
}: ReceiptEmailFormProps) {
  const router = useRouter();
  const errorId = useId();
  const successId = useId();

  const [email, setEmail] = useState(defaultEmail ?? "");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMessage = message.trim();

    if (!normalizedEmail) {
      setErrorMessage("Ingresá un email de destino.");
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await sendReceiptByEmail(receiptId, {
        to: normalizedEmail,
        message: normalizedMessage || undefined,
      });

      setSuccessMessage("Recibo enviado correctamente.");
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-describedby={[
        errorMessage ? errorId : null,
        successMessage ? successId : null,
      ]
        .filter(Boolean)
        .join(" ")}
      noValidate
    >
      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p
          id={successId}
          role="status"
          className="inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          <MailCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
          {successMessage}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label
          htmlFor="receipt-email-to"
          className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel"
        >
          Email destino
        </label>

        <input
          id="receipt-email-to"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="cliente@email.com"
          className="h-11 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="receipt-email-message"
          className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel"
        >
          Mensaje opcional
        </label>

        <textarea
          id="receipt-email-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Ej: Te envío el comprobante interno del trabajo realizado."
          className="resize-y rounded-xl border border-border-strong bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Send className="size-4 shrink-0" aria-hidden="true" />
        {isSubmitting ? "Enviando..." : "Enviar por email"}
      </button>
    </form>
  );
}