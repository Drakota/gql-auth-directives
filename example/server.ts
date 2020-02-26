import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import express from "express";

import { createAuthDirectives, authTypeDefs } from "../dist";
import resolvers from "./resolvers";
import typeDefs from "./schema";

const app = express();
const authDirectives = createAuthDirectives({
  isAuthenticatedHandler: ctx => {
    // Check if JWT is valid and fetch user with JWT from database
    console.log(ctx?.req?.headers?.authorization);
    ctx.user = { id: 1, firstName: "foo", lastName: "bar" };
  },
});
const schema = makeExecutableSchema({
  resolvers,
  typeDefs: [authTypeDefs, typeDefs],
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
