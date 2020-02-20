import { getDecodedToken } from "./utils/getDecodedToken";

export const hasPermissionHandler = (ctx: any, permissions: string[]) => {
  const decoded = getDecodedToken(ctx);
  const decodedPermissions = ((decoded as any)?.permissions as string[]) || [];

  if (permissions.length === 0) return;
  if (!permissions.some(p => decodedPermissions.find(dp => dp === p))) {
    throw new Error(`Insufficient permissions. Missing one of these: ${permissions.join(", ")}`);
  }
};

export const hasRoleHandler = (ctx: any, roles: string[]) => {
  const decoded = getDecodedToken(ctx);
  const decodedRoles = ((decoded as any)?.roles as string[]) || [];

  if (roles.length === 0) return;
  if (!roles.some(p => decodedRoles.find(dp => dp === p))) {
    throw new Error(`Insufficient roles. Missing one of these: ${roles.join(", ")}`);
  }
};

export const isAuthenticatedHandler = (ctx: any): void => {
  getDecodedToken(ctx);
};
