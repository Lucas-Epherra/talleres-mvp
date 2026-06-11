import { apiFetch } from "../../lib/api";
import type { UpdateVehicleInput, VehicleListItem } from "./types";

export type CreateVehicleInput = {
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year?: number;
  mileage?: number;
  notes?: string;
};

/**
 * Creates a vehicle inside the authenticated workshop.
 *
 * The backend derives workshopId from the httpOnly cookie session.
 */
export function createVehicle(
  input: CreateVehicleInput,
): Promise<VehicleListItem> {
  return apiFetch<VehicleListItem>("/vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Updates editable vehicle fields inside the authenticated workshop.
 *
 * The customer relationship is intentionally not editable from this mutation
 * because this screen only corrects vehicle data, not ownership.
 */
export function updateVehicle(
  vehicleId: string,
  input: UpdateVehicleInput,
): Promise<VehicleListItem> {
  return apiFetch<VehicleListItem>(`/vehicles/${vehicleId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}