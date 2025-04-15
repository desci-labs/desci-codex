import { test, describe, beforeAll, expect } from "vitest";
import { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { ModelInstanceClient } from "@ceramic-sdk/model-instance-client";
import { newFlightSqlClient, DEFAULT_LOCAL_FLIGHT } from "../src/c1/clients.js";
import { listResearchObjects } from "../src/c1/explore.js";
import {
  createResearchObject,
  updateResearchObject,
} from "../src/c1/mutate.js";
import type { ResearchObject } from "../src/types.js";
import { DID } from "dids";
import { didFromPkey } from "../src/clients.js";
import {
  registerModelInterests,
  MODEL_SCHEMAS,
} from "@desci-labs/desci-codex-models";
import { ModelClient } from "@ceramic-sdk/model-client";
import { errWithCause } from "pino-std-serializers";
import type { StreamID } from "@ceramic-sdk/identifiers";

describe("C1 module", async () => {
  let flightClient: FlightSqlClient;
  let modelClient: ModelClient;
  let midClient: ModelInstanceClient;
  let testDID: DID;
  let testModel: StreamID;
  let testResearchObject: ResearchObject;
  let createdResearchObjectId: string;

  beforeAll(async () => {
    testDID = await didFromPkey(
      "7052adea8f9823817065456ecad5bf24dcd31c5cd8277aa825ad6a84c6f369df",
    );

    try {
      modelClient = new ModelClient({
        ceramic: "http://localhost:5101",
        did: testDID,
      });

      midClient = new ModelInstanceClient({
        ceramic: "http://localhost:5101",
      });

      flightClient = await newFlightSqlClient(DEFAULT_LOCAL_FLIGHT);
    } catch (error) {
      console.error(
        "Failed to connect to ceramic-one, run `docker compose -f docker/compose.yaml up ceramic`",
        errWithCause(error as Error),
      );
      throw error;
    }

    try {
      // Create the model stream
      testModel = await modelClient.createDefinition(
        MODEL_SCHEMAS.researchObject,
        testDID,
      );
      console.log("Created model stream:", testModel.toString());
    } catch (error) {
      console.error(
        "Failed to create model stream",
        errWithCause(error as Error),
      );
      throw error;
    }

    // Register interest in the model
    await registerModelInterests("http://localhost:5101");

    // Create a test research object
    testResearchObject = {
      title: "Test Research Object",
      manifest: "QmTestManifestCID",
      license: "CC-BY",
    };
  });

  test("should create a research object", async () => {
    const result = await createResearchObject(
      midClient,
      testDID,
      testResearchObject,
      testModel,
    );

    expect(result).toHaveProperty("streamID");
    expect(result).toHaveProperty("commitID");
    expect(typeof result.streamID).toBe("string");
    expect(typeof result.commitID).toBe("string");

    // Store the ID for the update test
    createdResearchObjectId = result.streamID;

    console.log(
      "Created research object:",
      JSON.stringify(result, undefined, 2),
    );

    // Add a small delay to ensure the state is propagated
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  });

  test("should update a research object", async () => {
    // Skip this test if the previous test didn't create a research object
    if (!createdResearchObjectId) {
      console.log(
        "Skipping update test because no research object was created",
      );
      return;
    }

    // Create an update for the research object
    const updateContent = {
      id: createdResearchObjectId,
      title: "Updated Research Object",
    };

    const result = await updateResearchObject(
      midClient,
      testDID,
      updateContent,
    );

    expect(result).toHaveProperty("streamID");
    expect(result).toHaveProperty("commitID");
    expect(typeof result.streamID).toBe("string");
    expect(typeof result.commitID).toBe("string");
    expect(result.streamID).toBe(createdResearchObjectId);
  });

  test("should fetch research objects", async () => {
    const result = await listResearchObjects(flightClient, testModel);
    expect(result.map((ro) => ro.streamId)).toContain(createdResearchObjectId);
  });
});
