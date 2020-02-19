import { getDecodedToken } from "../utils/getDecodedToken";

const hasPermissionHandler = (ctx: any, permissions: string[]) => {
  const decoded = getDecodedToken(ctx);
  const decodedPermissions = ((decoded as any)?.permissions as string[]) || [];

  if (!permissions.some(p => decodedPermissions.find(dp => dp === p))) {
    throw new Error(`Insufficient permissions. Missing one of these: ${permissions.join(", ")}`);
  }
};

export default hasPermissionHandler;
