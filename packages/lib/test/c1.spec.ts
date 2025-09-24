import { test, describe, beforeAll, expect } from "vitest";
import { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { ModelInstanceClient } from "@ceramic-sdk/model-instance-client";
import {
  listResearchObjects,
  listResearchObjectsWithHistory,
} from "../src/c1/explore.js";
import {
  getCommitState,
  getStreamHistory,
  getStreamStateAtVersion,
} from "../src/c1/resolve.js";
import {
  createResearchObject,
  updateResearchObject,
} from "../src/c1/mutate.js";

import {
  registerModelInterests,
  MODEL_SCHEMAS,
} from "@desci-labs/desci-codex-models";
import { ModelClient } from "@ceramic-sdk/model-client";
import { errWithCause } from "pino-std-serializers";
import { CommitID, randomCID, StreamID } from "@ceramic-sdk/identifiers";
import { randomDID } from "./util.js";
import {
  DEFAULT_LOCAL_FLIGHT,
  newFlightSqlClient,
} from "../src/c1/flightclient.js";

describe("C1 module", async () => {
  const testDID = await randomDID();
  let flightClient: FlightSqlClient;
  let modelClient: ModelClient;
  let midClient: ModelInstanceClient;
  let testModel: StreamID;

  beforeAll(async () => {
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
        (ro) => ro.id === result.streamID,
      );
      expect(createdObject).toBeDefined();
      expect(createdObject).toMatchObject(testObject);
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

      const history = await getStreamHistory(
        flightClient,
        updateResult.streamID,
      );

      const newVersion = history.versions.at(-1);
      expect(newVersion).toBeDefined();
      expect(newVersion?.title).toBe(updateContent.title);
      expect(newVersion?.manifest).toBe(testObject.manifest);
      expect(newVersion?.license).toBe(testObject.license);
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
      expect(fetchedObjects.map((ro) => ro.id)).toContain(
        createResult.streamID,
      );

      fetchedObjects.forEach((ro) => {
        expect(ro).toHaveProperty("id");
        expect(ro).toHaveProperty("owner");

        expect(typeof ro.title).toBe("string");
        expect(typeof ro.manifest).toBe("string");
        expect(typeof ro.license).toBe("string");
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
    let testStreamId: string;
    let testCommitId: string;
    let updateCommitId: string;
    let testObject: {
      title: string;
      manifest: string;
      license: string;
    };

    beforeAll(async () => {
      // Create a test object that will be used by all tests in this group
      testObject = {
        title: "Shared History Test Object",
        manifest: "QmSharedHistoryTestManifestCID",
        license: "CC-BY",
      };

      // Create the research object
      const createResult = await createResearchObject(
        midClient,
        testDID,
        testObject,
        testModel,
      );

      testStreamId = createResult.streamID;
      testCommitId = createResult.commitID;

      // Wait for stream to be properly initialized
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      // Get the history to find the event height
      const history = await getStreamHistory(flightClient, testStreamId);

      expect(history.versions.length).toBeGreaterThan(0);
    });

    test("should track initial state of a research object", async () => {
      const history = await getStreamHistory(flightClient, testStreamId);

      expect(history.versions.length).toBeGreaterThan(0);
      expect(history.versions[0]).toBeDefined();
      expect(history.versions[0]).toMatchObject(testObject);

      const initialState = history.versions[0];
      expect(initialState).toMatchObject(testObject);
    });

    test("should track updates to a research object", async () => {
      const updateContent = {
        id: testStreamId,
        title: "Updated History Test Object",
        manifest: "QmUpdatedHistoryTestManifestCID",
        license: "CC-BY",
      };

      const updateIDs = await updateResearchObject(
        midClient,
        testDID,
        updateContent,
      );
      updateCommitId = updateIDs.commitID;

      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const history = await getStreamHistory(flightClient, testStreamId);

      expect(history.versions.length).toBe(2);

      expect(history.versions[0]).toMatchObject(testObject);

      const { id: _, ...expectedState } = updateContent;
      expect(history.versions[1]).toMatchObject(expectedState);
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

      expect(allHistories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: streamOne.streamID }),
          expect.objectContaining({ id: streamTwo.streamID }),
        ]),
      );

      const firstStreamVersions = allHistories.find(
        (h) => h.id === streamOne.streamID,
      )?.versions;
      const secondStreamVersions = allHistories.find(
        (h) => h.id === streamTwo.streamID,
      )?.versions;

      expect(firstStreamVersions?.length).toBe(2);
      expect(secondStreamVersions?.length).toBe(2);

      expect(firstStreamVersions?.[0]).toMatchObject({
        title: "Test Research Object 1",
        manifest: "QmTestManifestCID1",
        license: "MIT",
      });
      expect(firstStreamVersions?.[1]).toMatchObject({
        title: "Updated Test Research Object 1",
        manifest: "QmTestManifestCID1",
        license: "MIT",
      });

      expect(secondStreamVersions?.[0]).toMatchObject({
        title: "Test Research Object 2",
        manifest: "QmTestManifestCID2",
        license: "MIT",
      });
      expect(secondStreamVersions?.[1]).toMatchObject({
        title: "Updated Test Research Object 2",
        manifest: "QmTestManifestCID2",
        license: "MIT",
      });
    });

    test("should get state of a specific commit", async () => {
      const commitState = await getCommitState(flightClient, testCommitId);

      expect(commitState).toBeDefined();
      expect(commitState.state).toMatchObject(testObject);
      expect(commitState.id).toBe(testStreamId);
      expect(commitState.version).toBe(testCommitId);
    });

    test("should get state of a stream at a specific event height", async () => {
      const updatedContent = {
        version: updateCommitId,
        title: "Updated History Test Object",
        manifest: "QmUpdatedHistoryTestManifestCID",
        license: "CC-BY",
      };

      const stateAtVersion = await getStreamStateAtVersion(
        flightClient,
        testStreamId,
        1,
      );

      expect(stateAtVersion).toBeDefined();
      expect(stateAtVersion.state).toMatchObject(updatedContent);
      expect(stateAtVersion.id).toBe(testStreamId);
      expect(stateAtVersion.version).not.toBe(testCommitId);
    });

    test("should throw error for non-existent commit", async () => {
      const randomCid = randomCID().toString();
      const nonExistentCommitId = new CommitID("MID", randomCid);

      await expect(
        getCommitState(flightClient, nonExistentCommitId.toString()),
      ).rejects.toThrow(
        `No state found for stream ${nonExistentCommitId.baseID.toString()}`,
      );
    });

    test("should throw error for non-existent event height", async () => {
      const nonExistentHeight = 999999;

      await expect(
        getStreamStateAtVersion(flightClient, testStreamId, nonExistentHeight),
      ).rejects.toThrow(
        `No state found for stream ${testStreamId} at version ${nonExistentHeight}`,
      );
    });
  });
});
