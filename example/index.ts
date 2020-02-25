import server from "./server";

const port = process.env.PORT || 1234;
server.listen({ port }, async () => {
  console.log(`Server up and running at ${port}! 🚀`);
});
