import { gql } from "apollo-server-express";

export default gql`
  type Post {
    name: String!
    published: Boolean!
  }

  input CreatePostInput {
    name: String!
    published: Boolean! @hasPermission(permissions: ["PUBLISH_POSTS"])
  }

  type Query {
    me: String! @isAuthenticated
    posts: [Post!]! @hasPermission(permissions: ["GET_POSTS"])
  }

  type Mutation {
    createPost(data: CreatePostInput!): Post! @hasPermission(permissions: ["CREATE_POSTS"])
  }
`;
