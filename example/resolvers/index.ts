const posts = [
  {
    name: "Post 1",
    published: false,
  },
  {
    name: "Post 2",
    published: true,
  },
  {
    name: "Post 3",
    published: true,
  },
];

export default {
  Query: {
    me: (parent: any, args: any, ctx: any) => {
      return ctx.user;
    },
    posts: () => posts,
  },
  Mutation: {
    createPost: (parent: any, args: any) => {
      const published = args.data.published || false;

      return {
        name: args.data.name,
        published,
      };
    },
  },
};
