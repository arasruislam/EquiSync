import { UserRole } from "@/models/User";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  CO_FOUNDER: 4,
  PROJECT_MANAGER: 3,
  LEADER: 2,
  EMPLOYEE: 1,
};

/**
 * Checks if the user's role meets the minimum required role based on hierarchy.
 */
export function hasMinRole(userRole: string | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  const userRoleValue = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const minRoleValue = ROLE_HIERARCHY[minRole] || 0;
  return userRoleValue >= minRoleValue;
}

/**
 * Checks if the user's role is one of the specific allowed roles.
 */
export function hasAnyRole(userRole: string | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as UserRole);
}

/**
 * Specifically checks for Co-founder access.
 */
export function isCoFounder(userRole: string | undefined): boolean {
  return userRole === "CO_FOUNDER";
}
