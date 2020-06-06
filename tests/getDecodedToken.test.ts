import { getDecodedToken } from "../src/utils/getDecodedToken";

describe("Testing the getDecodedToken function", () => {
  it("should throw an error when there is no authorization header passed", async () => {
    expect(() => getDecodedToken({})).toThrow(/Authorization header missing.../);
  });

  it("should throw an error when the JWT_SECRET environment variable is not set", async () => {
    expect(() => getDecodedToken({ req: { headers: { authorization: "token" } } })).toThrow(
      /Missing JWT_SECRET environment variable.../,
    );
  });
});
