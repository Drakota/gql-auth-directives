import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import express from "express";
import { createAuthDirectives, authTypeDefs } from "../../dist";
import typeDefs from "./schema";
import resolvers from "./resolvers";

const app = express();
const authDirectives = createAuthDirectives();
const schema = makeExecutableSchema({
  resolvers,
  typeDefs: [typeDefs, authTypeDefs],
  schemaDirectives: { ...authDirectives },
});

const server = new ApolloServer({
  schema,
  context(ctx) {
    return { ...ctx };
  },
});
server.applyMiddleware({ app });

export default app;
