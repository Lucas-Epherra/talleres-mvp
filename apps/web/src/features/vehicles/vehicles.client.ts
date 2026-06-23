import { apiFetch } from "../../lib/api";
import type {
  ArchiveVehicleInput,
  CreateVehicleInput,
  RestoreVehicleInput,
  UpdateVehicleInput,
  VehicleListItem,
  VehicleProfile,
} from "./types";

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

/**
 * Archives a vehicle with a mandatory operational reason.
 */
export function archiveVehicle(
  vehicleId: string,
  input: ArchiveVehicleInput,
): Promise<VehicleProfile> {
  return apiFetch<VehicleProfile>(`/vehicles/${vehicleId}/archive`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Restores an archived vehicle with a mandatory operational reason.
 */
export function restoreVehicle(
  vehicleId: string,
  input: RestoreVehicleInput,
): Promise<VehicleProfile> {
  return apiFetch<VehicleProfile>(`/vehicles/${vehicleId}/restore`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
