import { ApolloServerTestClient } from "apollo-server-testing";
import gql from "graphql-tag";

import { createAuthDirectives } from "../src";
import { getDecodedToken } from "../src/utils/getDecodedToken";
import { createClient } from "./utils/createClient";

describe("Testing hasRole directive without handler overriding", () => {
  let client: ApolloServerTestClient;

  beforeAll(() => {
    const authDirectives = createAuthDirectives();
    client = createClient({
      typeDefs: gql`
        input TestInput {
          input: String! @hasRole(roles: ["USER", "ADMIN", "SUPER_ADMIN"])
          protectedInput: String @hasRole(roles: ["SUPER_ADMIN"])
        }
        type Query {
          protectedQuery(data: TestInput!): String! @hasRole(roles: ["USER"])
        }
        type Mutation {
          protectedMutation(data: TestInput!): String! @hasRole(roles: ["ADMIN", "SUPER_ADMIN"])
        }
      `,
      resolvers: {
        Query: {
          protectedQuery: (parent, args) =>
            `@QUERY Input: ${args.data.input} Protected Input: ${args.data.protectedInput}`,
        },
        Mutation: {
          protectedMutation: (parent, args) =>
            `@MUTATION Input: ${args.data.input} Protected Input: ${args.data.protectedInput}`,
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
    (getDecodedToken as any) = jest.fn(() => ({ roles: ["INVALID_ROLE"] }));
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
