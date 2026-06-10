import { apiServerFetch } from "../../lib/api.server";
import type { VehicleListItem, VehicleProfile } from "./types";

type GetVehiclesParams = {
  search?: string;
};

/**
 * Fetches vehicles for the authenticated workshop.
 *
 * Runs on the server and relies on apiServerFetch to forward the incoming
 * httpOnly cookie to the backend API.
 */
export function getVehicles({
  search,
}: GetVehiclesParams = {}): Promise<VehicleListItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  return apiServerFetch<VehicleListItem[]>(`/vehicles${query}`);
}

/**
 * Fetches the complete operational profile of a vehicle.
 *
 * This is the main product screen: customer, vehicle, active orders and
 * historical orders grouped by vehicle.
 */
export function getVehicleProfile(id: string): Promise<VehicleProfile> {
  return apiServerFetch<VehicleProfile>(`/vehicles/${id}/profile`);
}