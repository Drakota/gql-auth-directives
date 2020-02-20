import { ApolloServerTestClient } from "apollo-server-testing";
import gql from "graphql-tag";

import { createAuthDirectives } from "../src";
import { getDecodedToken } from "../src/utils/getDecodedToken";
import { createClient } from "./utils/createClient";

describe("Testing hasPermission directive without handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    const authDirectives = createAuthDirectives();
    client = createClient({
      typeDefs: gql`
        input TestInput {
          input: String! @hasRole(roles: ["USER", "ADMIN"])
          protectedInput: String @hasRole(roles: ["ADMIN"])
        }
        type Query {
          protectedQuery: String! @hasRole(roles: ["USER"])
        }
        type Mutation {
          protectedMutation(data: TestInput!): String!
        }
      `,
      resolvers: {
        Query: {
          protectedQuery: () => "Protected Query",
        },
        Mutation: {
          protectedMutation: (parent, args) => `Input: ${args.data.input} Protected Input: ${args.data.protectedInput}`,
        },
      },
      schemaDirectives: {
        ...authDirectives,
      },
    });
  });

  it("should allow accessing a query with the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["USER"] }));
    const res = await client.query({
      query: gql`
        {
          protectedQuery
        }
      `,
    });

    expect(res.data).toMatchSnapshot();
  });

  it("should prevent accessing a query without the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["ADMIN"] }));
    const res = await client.query({
      query: gql`
        {
          protectedQuery
        }
      `,
    });

    expect(res.errors).toMatchSnapshot();
  });
});
