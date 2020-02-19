import { getDecodedToken } from "../utils/getDecodedToken";

const hasRoleHandler = (ctx: any, roles: string[]) => {
  const decoded = getDecodedToken(ctx);
  const decodedRoles = ((decoded as any)?.roles as string[]) || [];

  if (!roles.some(p => decodedRoles.find(dp => dp === p))) {
    throw new Error(`Insufficient roles. Missing one of these: ${roles.join(", ")}`);
  }
};

export default hasRoleHandler;
