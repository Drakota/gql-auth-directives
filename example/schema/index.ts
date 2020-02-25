import { gql } from "apollo-server-express";

export default gql`
  type User {
    id: Int!
    firstName: String!
    lastName: String!
  }

  type Post {
    name: String!
    published: Boolean!
  }

  input CreatePostInput {
    name: String!
    published: Boolean @hasRole(roles: ["ADMIN"])
  }

  type Query {
    me: User! @isAuthenticated
    posts: [Post!]! @hasPermission(permissions: ["GET_POSTS"])
  }

  type Mutation {
    createPost(data: CreatePostInput!): Post! @hasPermission(permissions: ["CREATE_POSTS"])
  }
`;
