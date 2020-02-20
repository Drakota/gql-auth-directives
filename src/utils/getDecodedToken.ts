import * as jwt from "jsonwebtoken";

export const getDecodedToken = (ctx: any) => {
  const header =
    ctx?.request?.headers?.authorization || ctx?.connection?.context?.Authorization || ctx?.req?.headers?.authorization;

  if (!header) {
    throw new Error("Authorization header missing...");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable...");
  }

  const token = header.replace("Bearer ", "");
  return jwt.verify(token, process.env.JWT_SECRET as string);
};
