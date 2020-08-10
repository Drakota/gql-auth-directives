import { ApolloServerTestClient } from "apollo-server-testing";
import gql from "graphql-tag";

import { createAuthDirectives } from "../src";
import { getDecodedToken } from "../src/utils/getDecodedToken";
import { createClient } from "./utils/createClient";

describe("Testing hasRole directive without handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    client = createClient({
      typeDefs: gql`
        input TestInput {
          input: String!
          protectedInput: String @hasRole(roles: ["SUPER_ADMIN"])
        }
        type TestResponse {
          field: String!
          protectedFieldWithoutResolver: String @hasRole(roles: ["ADMIN"])
          protectedFieldWithResolver: String @hasRole(roles: ["ADMIN"])
        }
        type Query {
          protectedQuery(data: TestInput!): String! @hasRole(roles: ["USER"])
          unprotectedQuery: TestResponse!
        }
        type Mutation {
          protectedMutation(data: TestInput!): String! @hasRole(roles: ["ADMIN", "SUPER_ADMIN"])
        }
      `,
    });
  });

  it("should allow accessing a query with the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["USER"] }));
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

  it("should prevent accessing a query without the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["ADMIN"] }));
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

    expect(res.errors).toMatchSnapshot();
  });

  it("should allow accessing a query's input with necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["USER"] }));
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

  it("should prevent accessing a query's input without necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["USER"] }));
    const res = await client.query({
      query: gql`
        query protectedQuery($data: TestInput!) {
          protectedQuery(data: $data)
        }
      `,
      variables: {
        data: {
          input: "foo",
          protectedInput: "bar",
        },
      },
    });

    expect(res.errors).toMatchSnapshot();
  });

  it("should allow accessing a mutation with the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["ADMIN"] }));
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

  it("should prevent accessing a mutation without the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["USER"] }));
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

    expect(res.errors).toMatchSnapshot();
  });

  it("should allow accessing a mutation's input with necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["SUPER_ADMIN"] }));
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

  it("should prevent accessing a mutation's input without necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["ADMIN"] }));
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

    expect(res.errors).toMatchSnapshot();
  });

  it("should allow accessing a type's field without a resolver with the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["ADMIN"] }));
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

  it("should allow accessing a type's field with a resolver with the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["ADMIN"] }));
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

  it("should allow accessing a type's field without a resolver without the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: [] }));
    const res = await client.query({
      query: gql`
        {
          unprotectedQuery {
            protectedFieldWithoutResolver
          }
        }
      `,
    });

    expect(res.errors).toMatchSnapshot();
  });

  it("should allow accessing a type's field with a resolver without the necessary roles", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: [] }));
    const res = await client.query({
      query: gql`
        {
          unprotectedQuery {
            protectedFieldWithResolver
          }
        }
      `,
    });

    expect(res.errors).toMatchSnapshot();
  });
});

describe("Testing hasRole directive with handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    const authDirectives = createAuthDirectives({
      hasRoleHandler: (ctx, roles) => {
        throw new Error(`Roles passed: ${roles.join(", ")}`);
      },
    });
    client = createClient({
      typeDefs: gql`
        type Query {
          protectedQuery: String! @hasRole(roles: ["FOO", "BAR"])
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
    });
  });

  it("should override the hasRole default handler correctly and throw an error", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["INVALID_ROLE"] }));
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
