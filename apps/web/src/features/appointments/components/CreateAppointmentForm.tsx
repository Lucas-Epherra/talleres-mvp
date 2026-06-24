"use client";

import { ArrowLeft, CalendarPlus, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { NotesEditor } from "../../../components/ui/NotesEditor";
import { getApiErrorMessage } from "../../../lib/api";
import type { CustomerListItem } from "../../customers/types";
import type { VehicleListItem } from "../../vehicles/types";
import type { WorkOrder } from "../../work-orders/types";
import { createAppointment } from "../appointments.client";

const ACTIVE_WORK_ORDER_STATUSES = new Set<string>([
  "PENDING",
  "IN_PROGRESS",
  "READY",
]);

type CreateAppointmentFormProps = {
  customers: CustomerListItem[];
  vehicles: VehicleListItem[];
  workOrders: WorkOrder[];
};

type FormStatus = "idle" | "loading" | "error";

type CreateAppointmentFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Interactive mobile-first appointment creation form.
 *
 * Customer, vehicle and work order links are optional. When a work order is
 * selected, the backend infers the related vehicle and customer from that
 * operational context.
 */
export function CreateAppointmentForm({
  customers,
  vehicles,
  workOrders,
}: CreateAppointmentFormProps) {
  const router = useRouter();

  const activeCustomers = useMemo(
    () => customers.filter((customer) => !customer.archivedAt),
    [customers],
  );

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => !vehicle.archivedAt),
    [vehicles],
  );

  const activeWorkOrders = useMemo(
    () =>
      workOrders.filter((workOrder) =>
        ACTIVE_WORK_ORDER_STATUSES.has(workOrder.status),
      ),
    [workOrders],
  );

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const selectedWorkOrder = useMemo(
    () =>
      activeWorkOrders.find(
        (workOrder) => workOrder.id === selectedWorkOrderId,
      ) ?? null,
    [activeWorkOrders, selectedWorkOrderId],
  );

  const shouldUseWorkOrderContext = Boolean(selectedWorkOrder);

  const [state, setState] = useState<CreateAppointmentFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";

  function handleWorkOrderChange(value: string): void {
    setSelectedWorkOrderId(value);

    if (value) {
      setSelectedCustomerId("");
      setSelectedVehicleId("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = readString(formData, "title");
    const description = readString(formData, "description");
    const scheduledStart = readString(formData, "scheduledStart");
    const scheduledEnd = readString(formData, "scheduledEnd");

    if (title.length < 3) {
      setState({
        status: "error",
        message: "El título del turno debe tener al menos 3 caracteres.",
      });
      return;
    }

    if (!scheduledStart || !scheduledEnd) {
      setState({
        status: "error",
        message: "Indicá inicio y fin del turno.",
      });
      return;
    }

    const startDate = new Date(scheduledStart);
    const endDate = new Date(scheduledEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setState({
        status: "error",
        message: "Las fechas del turno no son válidas.",
      });
      return;
    }

    if (startDate >= endDate) {
      setState({
        status: "error",
        message: "El fin del turno debe ser posterior al inicio.",
      });
      return;
    }

    setState({
      status: "loading",
      message: null,
    });

    try {
      await createAppointment({
        title,
        description: description || undefined,
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate.toISOString(),
        workOrderId: selectedWorkOrderId || undefined,
        customerId: selectedWorkOrderId ? undefined : selectedCustomerId || undefined,
        vehicleId: selectedWorkOrderId ? undefined : selectedVehicleId || undefined,
      });

      router.replace("/appointments");
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
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? "create-appointment-error" : undefined}
    >
      <section
        aria-labelledby="create-appointment-main-heading"
        className="rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-8"
      >
        <div className="border-b border-border pb-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Nuevo turno
          </p>

          <h2
            id="create-appointment-main-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
          >
            Datos de agenda
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cargá una visita, turno o trabajo programado. Podés vincularlo con
            una orden activa, o dejarlo como agenda general.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <Field>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ej: Entrega pactada, revisión o seguimiento"
              disabled={isLoading}
              required
              maxLength={120}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <Label htmlFor="scheduledStart">Inicio *</Label>
              <Input
                id="scheduledStart"
                name="scheduledStart"
                type="datetime-local"
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <Label htmlFor="scheduledEnd">Fin *</Label>
              <Input
                id="scheduledEnd"
                name="scheduledEnd"
                type="datetime-local"
                disabled={isLoading}
                required
              />
            </Field>
          </div>

          <Field>
            <Label htmlFor="workOrderId">Orden de trabajo</Label>

            <select
              id="workOrderId"
              name="workOrderId"
              value={selectedWorkOrderId}
              onChange={(event) => handleWorkOrderChange(event.target.value)}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Sin orden asociada</option>

              {activeWorkOrders.map((workOrder) => (
                <option key={workOrder.id} value={workOrder.id}>
                  #{workOrder.orderNumber} · {workOrder.vehicle.licensePlate} ·{" "}
                  {workOrder.vehicle.customer.fullName}
                </option>
              ))}
            </select>

            <HelpText>
              Si seleccionás una orden, el turno queda vinculado a esa orden y
              se toma automáticamente su cliente y vehículo.
            </HelpText>
          </Field>

          {selectedWorkOrder ? (
            <section className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-surface text-primary">
                  <ClipboardList className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Contexto tomado de la orden
                  </p>

                  <h3 className="mt-2 font-display text-base font-black uppercase tracking-[0.04em] text-foreground">
                    Orden #{selectedWorkOrder.orderNumber}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cliente:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedWorkOrder.vehicle.customer.fullName}
                    </span>
                    {" · "}
                    Vehículo:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedWorkOrder.vehicle.licensePlate} ·{" "}
                      {selectedWorkOrder.vehicle.brand}{" "}
                      {selectedWorkOrder.vehicle.model}
                    </span>
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Los campos Cliente y Vehículo quedan bloqueados porque el
                    backend los infiere desde la orden seleccionada.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <Label htmlFor="customerId">Cliente</Label>

              <select
                id="customerId"
                name="customerId"
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                disabled={isLoading || shouldUseWorkOrderContext}
                className="h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {shouldUseWorkOrderContext
                    ? "Tomado desde la orden"
                    : "Sin cliente asociado"}
                </option>

                {activeCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} · {customer.phone}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <Label htmlFor="vehicleId">Vehículo</Label>

              <select
                id="vehicleId"
                name="vehicleId"
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                disabled={isLoading || shouldUseWorkOrderContext}
                className="h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {shouldUseWorkOrderContext
                    ? "Tomado desde la orden"
                    : "Sin vehículo asociado"}
                </option>

                {activeVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate} · {vehicle.brand} {vehicle.model} ·{" "}
                    {vehicle.customer.fullName}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <NotesEditor
            name="description"
            label="Descripción"
            disabled={isLoading}
            maxLength={1000}
            placeholder="Ej: Revisar pérdida de aceite, confirmar presupuesto o entregar vehículo."
          />
        </div>
      </section>

      {state.message ? (
        <p
          id="create-appointment-error"
          className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-start">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
          {isLoading ? "Creando..." : "Crear turno"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Reads a string value from FormData.
 */
function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

type FieldProps = {
  children: ReactNode;
};

/**
 * Form field wrapper.
 */
function Field({ children }: FieldProps) {
  return <div className="space-y-2">{children}</div>;
}

type LabelProps = {
  htmlFor: string;
  children: ReactNode;
};

/**
 * Accessible form label.
 */
function Label({ htmlFor, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold text-foreground"
    >
      {children}
    </label>
  );
}

type HelpTextProps = {
  children: ReactNode;
};

/**
 * Small helper text for field-level instructions.
 */
function HelpText({ children }: HelpTextProps) {
  return <p className="text-xs leading-5 text-muted-foreground">{children}</p>;
}

type InputProps = {
  id: string;
  name: string;
  type?: "text" | "datetime-local";
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
};

/**
 * Shared input for appointment forms.
 */
function Input({
  id,
  name,
  type = "text",
  placeholder,
  disabled,
  required,
  maxLength,
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      className="h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}