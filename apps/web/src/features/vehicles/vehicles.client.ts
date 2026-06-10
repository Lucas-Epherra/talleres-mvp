import { apiFetch } from "../../lib/api";
import type { VehicleListItem } from "./types";

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