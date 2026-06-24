import { EmptyState } from "../../../components/ui/EmptyState";
import { AppointmentCard } from "./AppointmentCard";
import type { Appointment } from "../types";

type AgendaViewProps = {
  appointments: Appointment[];
  hasFilters: boolean;
};

/**
 * Mobile-first agenda list.
 *
 * This is the primary operational view. A future CalendarView can consume the
 * same Appointment model without changing this component.
 */
export function AgendaView({ appointments, hasFilters }: AgendaViewProps) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        eyebrow={hasFilters ? "Sin resultados" : "Agenda libre"}
        title={
          hasFilters
            ? "No se encontraron turnos"
            : "No hay turnos para este rango"
        }
        description={
          hasFilters
            ? "Probá limpiar filtros o buscar por otro cliente, vehículo, motivo u orden."
            : "Cuando cargues turnos, visitas o trabajos programados, van a aparecer en esta agenda."
        }
        actions={[
          {
            label: "Nuevo turno",
            href: "/appointments/new",
            variant: "primary",
          },
          {
            label: "Limpiar filtros",
            href: "/appointments",
            variant: "secondary",
          },
        ]}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}
