import { ApolloServerTestClient } from "apollo-server-testing";
import gql from "graphql-tag";
import jwt from "jsonwebtoken";

import { createAuthDirectives } from "../src";
import { createClient } from "./utils/createClient";

describe("Testing isAuthenticated directive without handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    process.env.JWT_SECRET = "jest";
    const token = jwt.sign({}, process.env.JWT_SECRET);
    client = createClient(
      {
        typeDefs: gql`
          input TestInput {
            input: String!
            protectedInput: String @isAuthenticated
          }
          type TestResponse {
            field: String!
            protectedFieldWithoutResolver: String @isAuthenticated
            protectedFieldWithResolver: String @isAuthenticated
          }
          type Query {
            protectedQuery(data: TestInput!): String!
            unprotectedQuery: TestResponse!
          }
          type Mutation {
            protectedMutation(data: TestInput!): String! @isAuthenticated
          }
        `,
      },
      {
        req: { headers: { authorization: `Bearer ${token}` } },
      },
    );
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  it("should allow accessing a query's input authenticated", async () => {
    const res = await client.query({
      query: gql`
        query protectedQuery($data: TestInput!) {
          protectedQuery(data: $data)
        }
      `,
      variables: {
        data: {
          input: "foo",
        },
      },
    });

    expect(res.data).toMatchSnapshot();
  });

  it("should allow accessing a mutation authenticated", async () => {
    const res = await client.mutate({
      mutation: gql`
        mutation protectedMutation($data: TestInput!) {
          protectedMutation(data: $data)
        }
      `,
      variables: {
        data: {
          input: "foo",
        },
      },
    });

    expect(res.data).toMatchSnapshot();
  });

  it("should allow accessing a mutation's input authenticated", async () => {
    const res = await client.mutate({
      mutation: gql`
        mutation protectedMutation($data: TestInput!) {
          protectedMutation(data: $data)
        }
      `,
      variables: {
        data: {
          input: "foo",
          protectedInput: "bar",
        },
      },
    });

    expect(res.data).toMatchSnapshot();
  });

  it("should allow accessing a type's field without a resolver authenticated", async () => {
    const res = await client.query({
      query: gql`
        {
          unprotectedQuery {
            protectedFieldWithoutResolver
          }
        }
      `,
    });

    expect(res.data).toMatchSnapshot();
  });

  it("should allow accessing a type's field with a resolver authenticated", async () => {
    const res = await client.query({
      query: gql`
        {
          unprotectedQuery {
            protectedFieldWithResolver
          }
        }
      `,
    });

    expect(res.data).toMatchSnapshot();
  });
});

describe("Testing isAuthenticated directive with handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    const authDirectives = createAuthDirectives({
      isAuthenticatedHandler: ctx => {
        throw new Error(`Authorization header: ${ctx.req.headers.authorization}`);
      },
    });
    client = createClient(
      {
        typeDefs: gql`
          type Query {
            protectedQuery: String! @isAuthenticated
          }
        `,
        resolvers: {
          Query: {
            protectedQuery: () => "Protected Query",
          },
        },
        schemaDirectives: {
          ...authDirectives,
        },
      },
      {
        req: { headers: { authorization: `Bearer TOKEN` } },
      },
    );
  });

  it("should override the isAuthenticated default handler correctly and throw an error", async () => {
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
