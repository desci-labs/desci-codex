import { serveEncodedDefinition } from "@composedb/devtools-node";

/**
 * Runs GraphiQL server to view & query composites.
 */
const server = await serveEncodedDefinition({
  ceramicURL: "http://localhost:7007",
  graphiql: true,
  path: "./src/__generated__/definition.json",
  port: 5001,
});

console.log(`Server started on port ${server.port}`);

for (const signal in ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => {
      console.log("Server stopped");
    });
  });
};
