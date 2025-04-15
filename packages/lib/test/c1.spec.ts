import { test, describe, beforeAll, expect } from "vitest";
import { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { ModelInstanceClient } from "@ceramic-sdk/model-instance-client";
import { newFlightSqlClient, DEFAULT_LOCAL_FLIGHT } from "../src/c1/clients.js";
import {
  listResearchObjects,
  getStreamHistory,
  listResearchObjectsWithHistory,
} from "../src/c1/explore.js";
import {
  createResearchObject,
  updateResearchObject,
} from "../src/c1/mutate.js";
import { DID } from "dids";
import { didFromPkey } from "../src/clients.js";
import {
  registerModelInterests,
  MODEL_SCHEMAS,
} from "@desci-labs/desci-codex-models";
import { ModelClient } from "@ceramic-sdk/model-client";
import { errWithCause } from "pino-std-serializers";
import { randomCID, StreamID } from "@ceramic-sdk/identifiers";

describe("C1 module", async () => {
  let flightClient: FlightSqlClient;
  let modelClient: ModelClient;
  let midClient: ModelInstanceClient;
  let testDID: DID;
  let testModel: StreamID;

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

    await registerModelInterests("http://localhost:5101");
  });

  describe("Basic operations", () => {
    test("should create a research object", async () => {
      const testObject = {
        title: "Test Research Object",
        manifest: "QmTestManifestCID",
        license: "CC-BY",
      };

      const result = await createResearchObject(
        midClient,
        testDID,
        testObject,
        testModel,
      );

      expect(result).toMatchObject({
        streamID: expect.any(String),
        commitID: expect.any(String),
      });
      expect(result.streamID).not.toBe("");
      expect(result.commitID).not.toBe("");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const fetchedObjects = await listResearchObjects(flightClient, testModel);
      const createdObject = fetchedObjects.find(
        (ro) => ro.streamId === result.streamID,
      );
      expect(createdObject).toBeDefined();
      expect(createdObject?.state).toMatchObject(testObject);
    });

    test("should update a research object", async () => {
      const testObject = {
        title: "Test Research Object Update",
        manifest: "QmTestManifestCID",
        license: "CC-BY-4.0",
      };

      const createResult = await createResearchObject(
        midClient,
        testDID,
        testObject,
        testModel,
      );
      expect(createResult.streamID).toBeTruthy();
      expect(createResult.commitID).toBeTruthy();

      // Wait for stream to be properly initialized
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const updateContent = {
        id: createResult.streamID,
        title: "Updated Research Object",
        manifest: testObject.manifest,
        license: testObject.license,
      };

      const updateResult = await updateResearchObject(
        midClient,
        testDID,
        updateContent,
      );

      expect(updateResult).toMatchObject({
        streamID: createResult.streamID,
        commitID: expect.any(String),
      });
      expect(updateResult.commitID).not.toBe("");

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const fetchedObjects = await listResearchObjects(flightClient, testModel);
      const updatedObject = fetchedObjects.find(
        (ro) => ro.streamId === createResult.streamID,
      );
      expect(updatedObject).toBeDefined();
      expect(updatedObject?.state.title).toBe(updateContent.title);
      expect(updatedObject?.state.manifest).toBe(testObject.manifest);
      expect(updatedObject?.state.license).toBe(testObject.license);
    });

    test("should fetch research objects", async () => {
      const testObject = {
        title: "Test Object for Fetch",
        manifest: "QmTestManifestCIDFetch",
        license: "CC-BY",
      };

      const createResult = await createResearchObject(
        midClient,
        testDID,
        testObject,
        testModel,
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const fetchedObjects = await listResearchObjects(flightClient, testModel);

      expect(Array.isArray(fetchedObjects)).toBe(true);
      expect(fetchedObjects.length).toBeGreaterThan(0);
      expect(fetchedObjects.map((ro) => ro.streamId)).toContain(
        createResult.streamID,
      );

      fetchedObjects.forEach((ro) => {
        expect(ro).toHaveProperty("streamId");
        expect(ro).toHaveProperty("owner");
        expect(ro).toHaveProperty("state");

        expect(ro.state).toHaveProperty("title");
        expect(typeof ro.state.title).toBe("string");

        if (ro.state.manifest) {
          expect(typeof ro.state.manifest).toBe("string");
        }
        if (ro.state.license) {
          expect(typeof ro.state.license).toBe("string");
        }
      });
    });

    test("should fail to update non-existent research object", async () => {
      const nonExistentId = randomCID().toString();
      const updateContent = {
        id: nonExistentId,
        title: "This Should Fail",
      };

      await expect(
        updateResearchObject(midClient, testDID, updateContent),
      ).rejects.toThrow();
    });
  });

  describe("Historical state tracking", () => {
    test("should track initial state of a research object", async () => {
      const testObject = {
        title: "History Test Object",
        manifest: "QmHistoryTestManifestCID",
        license: "CC-BY",
      };

      const createResult = await createResearchObject(
        midClient,
        testDID,
        testObject,
        testModel,
      );

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const history = await getStreamHistory(
        flightClient,
        createResult.streamID,
      );

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].state).toBeDefined();
      expect(history[0].state).toMatchObject(testObject);

      const initialState = history[0].state;
      expect(initialState).toMatchObject(testObject);
    });

    test("should track updates to a research object", async () => {
      const testObject = {
        title: "Update History Test Object",
        manifest: "QmUpdateHistoryTestManifestCID",
        license: "CC-BY",
      };

      const createResult = await createResearchObject(
        midClient,
        testDID,
        testObject,
        testModel,
      );

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const updateContent = {
        id: createResult.streamID,
        title: "Updated History Test Object",
        manifest: "QmUpdatedHistoryTestManifestCID",
        license: "CC-BY",
      };

      await updateResearchObject(midClient, testDID, updateContent);

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const history = await getStreamHistory(
        flightClient,
        createResult.streamID,
      );

      expect(history.length).toBe(2);

      expect(history[0].state).toMatchObject(testObject);

      const { id: _, ...expectedState } = updateContent;
      expect(history[1].state).toMatchObject(expectedState);
    });

    test("should track all streams implementing a model", async () => {
      const newModel = await modelClient.createDefinition(
        {
          ...MODEL_SCHEMAS.researchObject,
          description: randomCID().toString(),
        },
        testDID,
      );

      const streamOne = await createResearchObject(
        midClient,
        testDID,
        {
          title: "Test Research Object 1",
          manifest: "QmTestManifestCID1",
          license: "MIT",
        },
        newModel,
      );

      const streamTwo = await createResearchObject(
        midClient,
        testDID,
        {
          title: "Test Research Object 2",
          manifest: "QmTestManifestCID2",
          license: "MIT",
        },
        newModel,
      );

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      await updateResearchObject(midClient, testDID, {
        id: streamOne.streamID,
        title: "Updated Test Research Object 1",
        manifest: "QmTestManifestCID1",
        license: "MIT",
      });

      await updateResearchObject(midClient, testDID, {
        id: streamTwo.streamID,
        title: "Updated Test Research Object 2",
        manifest: "QmTestManifestCID2",
        license: "MIT",
      });

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const allHistories = await listResearchObjectsWithHistory(
        flightClient,
        newModel,
      );

      expect(Object.keys(allHistories).length).toBe(2);

      const streamIds = Object.keys(allHistories);
      expect(streamIds).toContain(streamOne.streamID);
      expect(streamIds).toContain(streamTwo.streamID);

      const firstStreamVersions = allHistories[streamOne.streamID];
      const secondStreamVersions = allHistories[streamTwo.streamID];

      expect(firstStreamVersions.length).toBe(2);
      expect(secondStreamVersions.length).toBe(2);

      expect(firstStreamVersions[0].state).toMatchObject({
        title: "Test Research Object 1",
        manifest: "QmTestManifestCID1",
        license: "MIT",
      });
      expect(firstStreamVersions[1].state).toMatchObject({
        title: "Updated Test Research Object 1",
        manifest: "QmTestManifestCID1",
        license: "MIT",
      });

      expect(secondStreamVersions[0].state).toMatchObject({
        title: "Test Research Object 2",
        manifest: "QmTestManifestCID2",
        license: "MIT",
      });
      expect(secondStreamVersions[1].state).toMatchObject({
        title: "Updated Test Research Object 2",
        manifest: "QmTestManifestCID2",
        license: "MIT",
      });
    });
  });
});
