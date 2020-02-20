import { ApolloServer, makeExecutableSchema, IExecutableSchemaDefinition } from "apollo-server-express";
import { ApolloServerTestClient, createTestClient } from "apollo-server-testing";

import { authTypeDefs } from "../../src";

export const createClient = (schemaDefinition: IExecutableSchemaDefinition<any>): ApolloServerTestClient => {
  const schema = makeExecutableSchema({
    ...schemaDefinition,
    typeDefs: [schemaDefinition.typeDefs as any, authTypeDefs],
  });
  return createTestClient(
    new ApolloServer({
      schema,
      context(ctx) {
        return { ...ctx };
      },
    }),
  );
};
