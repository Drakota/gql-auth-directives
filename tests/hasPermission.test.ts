import { ApolloServerTestClient } from "apollo-server-testing";
import gql from "graphql-tag";

import { createAuthDirectives } from "../src";
import { getDecodedToken } from "../src/utils/getDecodedToken";
import { createClient } from "./utils/createClient";

describe("Testing hasPermission directive without handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    client = createClient({
      typeDefs: gql`
        input TestInput {
          input: String!
          protectedInput: String @hasPermission(permissions: ["PROTECTED_INPUT"])
        }
        type TestResponse {
          field: String!
          protectedFieldWithoutResolver: String @hasPermission(permissions: ["PROTECTED_FIELD"])
          protectedFieldWithResolver: String @hasPermission(permissions: ["PROTECTED_FIELD"])
        }
        type Query {
          protectedQuery(data: TestInput!): String! @hasPermission(permissions: ["PROTECTED_QUERY"])
          unprotectedQuery: TestResponse!
        }
        type Mutation {
          protectedMutation(data: TestInput!): String!
        }
      `,
    });
  });

  it("should allow accessing a query with the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_QUERY"] }));
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

  it("should prevent accessing a query without the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_INPUT"] }));
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

  it("should allow accessing a query's input with necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_QUERY", "PROTECTED_INPUT"] }));
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

    expect(res.data).toMatchSnapshot();
  });

  it("should prevent accessing a query's input without necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_QUERY", "INVALID_PERMISSION"] }));
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

  it("should allow accessing a mutation's input with necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_INPUT"] }));
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

  it("should prevent accessing a mutation's input without necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["INVALID_PERMISSION"] }));
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

  it("should allow accessing another mutation's input that is not protected", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["INVALID_PERMISSION"] }));
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

  it("should allow accessing a type's field without a resolver with the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_FIELD"] }));
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

  it("should allow accessing a type's field with a resolver with the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["PROTECTED_FIELD"] }));
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

  it("should allow accessing a type's field without a resolver without the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: [] }));
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

  it("should allow accessing a type's field with a resolver without the necessary permissions", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: [] }));
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

describe("Testing hasPermission directive with handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    const authDirectives = createAuthDirectives({
      hasPermissionHandler: (ctx, permissions) => {
        throw new Error(`Permissions passed: ${permissions.join(", ")}`);
      },
    });
    client = createClient({
      typeDefs: gql`
        type Query {
          protectedQuery: String! @hasPermission(permissions: ["FOO", "BAR"])
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

  it("should override the hasPermission default handler correctly and throw an error", async () => {
    (getDecodedToken as any) = jest.fn(() => ({ permissions: ["INVALID_PERMISSION"] }));
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
