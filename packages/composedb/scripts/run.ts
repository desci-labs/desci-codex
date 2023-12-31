import ora from "ora";
import { readFileSync } from "fs";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import { writeComposite } from "./composites.js";

const events = new EventEmitter();
const spinner = ora();

const ceramic = spawn("npm", ["run", "ceramic"]);
ceramic.stdout.on("data", async (buffer) => {
  console.log("[Ceramic]", buffer.toString());
  if (buffer.toString().includes("0.0.0.0:7007")) {
    events.emit("ceramic", true);
    spinner.succeed("ceramic node started");
  }
});

ceramic.stderr.on("data", (err) => {
  console.log(err.toString());
});

const bootstrap = async () => {
  // TODO: convert to event driven to ensure functions run in correct orders after releasing the bytestream.
  // TODO: check if .grapql files match their .json counterparts
  //       & do not create the model if it already exists & has not been updated
  try {
    spinner.info("[Composites] bootstrapping composites");
    await writeComposite(readFileSync("admin_seed.txt", "utf8"), spinner);
    spinner.succeed("Composites] composites bootstrapped");
  } catch (err) {
    spinner.fail(JSON.stringify(err, undefined, 2));
    ceramic.kill();
    throw err;
  }
};

const graphiql = async () => {
  spinner.info("[GraphiQL] Starting server");
  const graphiql = spawn("node", ["./scripts/graphiql.mjs"]);
  spinner.succeed("[GraphiQL] Server started");
  graphiql.stdout.on("data", (buffer) => {
    console.log("[GraphiqQL]", buffer.toString());
  });
};

const start = async () => {
  try {
    spinner.start("[Ceramic] Starting Ceramic node\n");
    events.on("ceramic", async (isRunning) => {
      if (isRunning) {
        await bootstrap();
        await graphiql();
      }
      if (isRunning === false) {
        ceramic.kill();
        process.exit();
      }
    });
  } catch (err) {
    ceramic.kill();
    spinner.fail(JSON.stringify(err, undefined, 2));
  }
};

for (const signal in ["SIGTERM", "SIGINT", "beforeExit"]) {
  process.on(signal, () => ceramic.kill());
}

start();
