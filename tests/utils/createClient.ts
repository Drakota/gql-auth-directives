import { ApolloServer, makeExecutableSchema, IExecutableSchemaDefinition } from "apollo-server-express";
import { ApolloServerTestClient, createTestClient } from "apollo-server-testing";

import { authTypeDefs, createAuthDirectives } from "../../src";

export const createClient = (
  schemaDefinition: IExecutableSchemaDefinition<any>,
  additionalContext?: any,
): ApolloServerTestClient => {
  const authDirectives = createAuthDirectives();
  const schema = makeExecutableSchema({
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
    ...schemaDefinition,
    typeDefs: [schemaDefinition.typeDefs as any, authTypeDefs],
  });
  return createTestClient(
    new ApolloServer({
      schema,
      context(ctx) {
        return { ...ctx, ...additionalContext };
      },
    }),
  );
};
