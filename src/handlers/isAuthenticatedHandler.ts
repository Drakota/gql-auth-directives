import { getDecodedToken } from "../utils/getDecodedToken";

const isAuthenticatedHandler = (ctx: any): void => {
  getDecodedToken(ctx);
};

export default isAuthenticatedHandler;
