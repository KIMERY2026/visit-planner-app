import type { Role } from "@prisma/client";

/**
 * Access tiers, matching the proposal:
 *  - MP: full access (everything, including deleting places/visits and managing the catalogue).
 *  - ASSISTANT: catalogue + calendar (plan) + reports/dashboard. Can add/edit places, log and
 *    undo visits, run the planner. Cannot delete places or delete historical visit records.
 *  - STAFF: read dashboard/places/history, can log a visit for a planned item, cannot edit the
 *    catalogue or delete anything.
 */
export const permissions = {
  canEditPlaces: (role: Role) => role === "MP" || role === "ASSISTANT",
  canDeletePlaces: (role: Role) => role === "MP",
  canManagePlan: (role: Role) => role === "MP" || role === "ASSISTANT",
  canLogVisit: (_role: Role) => true, // every tier can mark a visit done
  canDeleteVisit: (role: Role) => role === "MP" || role === "ASSISTANT",
  canManageUsers: (role: Role) => role === "MP",
};

export type Permissions = typeof permissions;
