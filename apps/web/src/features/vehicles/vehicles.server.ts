import { apiServerFetch } from "../../lib/api.server";
import type {
  PaginatedResponse,
  VehicleListItem,
  VehicleProfile,
  VehiclesQuery,
} from "./types";

/**
 * Fetches paginated vehicles for the authenticated workshop.
 *
 * Use this function in vehicle list screens that need pagination metadata.
 */
export function getPaginatedVehicles(
  query: VehiclesQuery = {},
): Promise<PaginatedResponse<VehicleListItem>> {
  const params = new URLSearchParams();

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.archiveStatus && query.archiveStatus !== "active") {
    params.set("archiveStatus", query.archiveStatus);
  }

  const queryString = params.toString();
  const path = queryString ? `/vehicles?${queryString}` : "/vehicles";

  return apiServerFetch<PaginatedResponse<VehicleListItem>>(path);
}

/**
 * Fetches active vehicle options for forms that need a plain vehicle array.
 *
 * Archived vehicles stay out of operational creation flows by default.
 */
export async function getVehicles(
  query: Omit<VehiclesQuery, "page" | "limit"> = {},
): Promise<VehicleListItem[]> {
  const vehiclesPage = await getPaginatedVehicles({
    search: query.search,
    archiveStatus: query.archiveStatus ?? "active",
    limit: 50,
  });

  return vehiclesPage.data;
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
