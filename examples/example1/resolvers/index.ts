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
    me: () => {
      return "Hey, it's me and I'm logged in!";
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
