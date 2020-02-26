<p align="center" style="background: #112233; border-radius: 10px; box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);">
    <img src="../assets/logo.png" />
    <br/><br/>
</p>

---

# Summary

`gql-auth-directives` is a set of schema directives that allows a granular approach to role-based access control with GraphQL.

## Features

- Directives for roles, permissions and authentication
- Allows access control for queries, mutations
- Allows access control for input types
- Provided with default handlers using JWTs

# Getting Started

## Prerequisites

This package requires the user to use a server that supports [Apollo schema directives](https://www.apollographql.com/docs/graphql-tools/schema-directives/).

## Installing

Use npm

```
$ npm install --save gql-auth-directives
```

or yarn

```
$ yarn add gql-auth-directives
```

to install the package.

# Available directives

- `@hasRole(roles: ["ADMIN", "USER"])`
  > A user with either an admin or user role will be authorized
- `@hasPermission(permissions: ["CREATE_USERS"])`
- `@isAuthenticated`

# Setup

## Default handlers

To use the default handlers, the environment variable `JWT_SECRET` must be set. The variable will be used for verifying authorization headers and grab `roles`/`permissions` arrays in the token's payload.

We need to generate the auth directives and add it to the server configuration like so:

```javascript
import { createAuthDirectives } from "gql-auth-directives";

const authDirectives = createAuthDirectives();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: { ...authDirectives },
  context(ctx) {
    return { ...ctx }; // ⚠ Make sure to always pass the ctx from the server's context function
  },
});
```

## Override handlers

The library also allows using custom functions for the provided directives.

You could override the `hasPermission` handler like so:

```javascript
import { createAuthDirectives } from "gql-auth-directives";

const authDirectives = createAuthDirectives({
  hasPermissionHandler: (ctx, permissions) => {
    const user = getUser(ctx);
    // Do something with the user and throw an error if the user's permissions doesn't match the permissions passed
  },
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: { ...authDirectives },
  context(ctx) {
    return { ...ctx };
  },
});
```

## Schema declarations

We also need to add the directives declarations at the top of our GraphQL schema like so:

```graphql
directive @isAuthenticated on FIELD | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
directive @hasPermission(permissions: [String!]!) on FIELD | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
directive @hasRole(roles: [String!]!) on FIELD | FIELD_DEFINITION | INPUT_FIELD_DEFINITION

[...]
```

If you use something like `makeExecutableSchema` from [graphql-tools](https://github.com/apollographql/graphql-tools) that allows schema stitching you can also add the directives declarations like so:

```javascript
import { createAuthDirectives, authTypeDefs } from "gql-auth-directives";
import { makeExecutableSchema } from "graphql-tools";

const authDirectives = createAuthDirectives();

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
```

# Usage

We can now use our directives inside our GraphQL schema:

```graphql
input CreatePostInput {
  name: String!
  description: String!
  published: Boolean @hasPermission(permissions: ["PUBLISH_POST"])
}

type Mutation {
  createPost(data: CreatePostInput!): Post! @hasRole(roles: ["AUTHOR"])
}

type Query {
  me: User! @isAuthenticated
}
```

> ℹ Notice that you can also use the directives for inputs. If an unauthorized user tries to fill the published field it will throw an error and never reach the resolver.
