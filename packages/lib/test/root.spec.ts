/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComposeClient } from "@composedb/client";
import { definition } from "@desci-labs/desci-codex-composedb/src/__generated__/definition.js";
import { test, describe, beforeAll, expect } from "vitest";
import {
  mutationCreateResearchField,
  queryAnnotation,
  queryAttestation,
  queryClaim,
  queryContributorRelation,
  queryProfile,
  queryReferenceRelation,
  queryResearchComponent,
  queryResearchFieldRelation,
  queryResearchFields,
  queryResearchObject,
  querySocialHandle,
} from "../src/queries.js";
import { randomDID } from "./util.js";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { setTimeout } from "timers/promises";
import type {
  Annotation,
  Attestation,
  Claim,
  ContributorRelation,
  Profile,
  ReferenceRelation,
  ResearchObject,
  SocialHandle,
} from "../src/types.js";
import { StreamID } from "@ceramicnetwork/streamid";
import type { RuntimeCompositeDefinition } from "@composedb/types";
import {
  createAnnotation,
  createAttestation,
  createClaim,
  createContributorRelation,
  createProfile,
  createReferenceRelation,
  createResearchComponent,
  createResearchFieldRelation,
  createResearchObject,
  createSocialHandle,
  updateAttestation,
  updateContributorRelation,
  updateProfile,
  updateReferenceRelation,
  updateResearchComponent,
  updateResearchObject,
  updateSocialHandle,
} from "../src/mutate.js";
import { loadAtTime, loadVersionIndex } from "../src/streams.js";

const CERAMIC_API = "http:/localhost:7007";
const A_CID = "bafybeibeaampol2yz5xuoxex7dxri6ztqveqrybzfh5obz6jrul5gb4cf4";

const ceramic = new CeramicClient(CERAMIC_API);

describe("ComposeDB nodes", () => {
  beforeAll(async () => {
    try {
      await fetch(`${CERAMIC_API}/api/v0`);
    } catch (e) {
      console.error(
        'Failed connection to Ceramic. Run with "make test" or against live devserver!',
      );
      process.exit(1);
    }
  });

  describe("User can create", async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    // Create mutations error on failure and are otherwise successful
    test("research object", async () => {
      const data: ResearchObject = {
        title: "Test",
        manifest: A_CID,
        metadata: A_CID,
      };
      const researchObject = await createResearchObject(composeClient, data);
      const result = await queryResearchObject(
        composeClient,
        researchObject.streamID,
      );
      expect(result).toEqual(data);
    });

    test("profile", async () => {
      const data: Profile = {
        displayName: "First Lastname",
        publicKey: "public-key",
      };
      const profile = await createProfile(composeClient, data);

      const result = await queryProfile(composeClient, profile.streamID);
      expect(result).toEqual(data);
    });

    test("social handle", async () => {
      const data: SocialHandle = {
        platform: "orcid",
        handle: "111-222",
      };
      const socialHandle = await createSocialHandle(composeClient, data);

      const result = await querySocialHandle(
        composeClient,
        socialHandle.streamID,
      );
      expect(result).toEqual(data);
    });

    test("claim", async () => {
      const data: Claim = {
        title: "My Claim",
        description: "The point of the claim",
        badge: A_CID,
      };
      const claim = await createClaim(composeClient, data);

      const result = await queryClaim(composeClient, claim.streamID);
      expect(result).toEqual(data);
    });

    test("attestation to own research object", async () => {
      const myResearchObject = await createResearchObject(composeClient, {
        title: "Test",
        manifest: A_CID,
      });
      const myClaim = await createClaim(composeClient, {
        title: "My Claim",
        description: "The point of the claim",
        badge: A_CID,
      });
      const data: Attestation = {
        targetID: myResearchObject.streamID,
        targetVersion: myResearchObject.commitID,
        claimID: myClaim.streamID,
        claimVersion: myClaim.commitID,
        revoked: false,
      };
      const attestation = await createAttestation(composeClient, data);
      const result = await queryAttestation(
        composeClient,
        attestation.streamID,
      );
      expect(result).toEqual(data);
    });
  });

  describe("User can update", async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    test("research object", async () => {
      const data: ResearchObject = {
        title: "Test",
        manifest: A_CID,
      };
      const researchObject = await createResearchObject(composeClient, data);

      await waitAndSync(researchObject.streamID);
      await updateResearchObject(composeClient, {
        id: researchObject.streamID,
        metadata: A_CID, // Add some new metadata
      });
      const result = await queryResearchObject(
        composeClient,
        researchObject.streamID,
      );
      expect(result).toEqual({ ...data, metadata: A_CID });
    });

    test("profile", async () => {
      const profile = await createProfile(composeClient, {
        displayName: "My Name",
      });

      const newProfile = {
        displayName: "My Name",
        publicKey: "public-key",
      };
      await waitAndSync(profile.streamID);
      await updateProfile(composeClient, newProfile);

      const result = await queryProfile(composeClient, profile.streamID);
      expect(result).toEqual(newProfile);
    });

    test("social handle", async () => {
      const socialHandle = await createSocialHandle(composeClient, {
        platform: "orcid",
        handle: "111-222",
      });

      const newSocialHandle = {
        handle: "000-000",
      };
      await waitAndSync(socialHandle.streamID);
      await updateSocialHandle(composeClient, {
        ...newSocialHandle,
        id: socialHandle.streamID,
      });

      const result = await querySocialHandle(
        composeClient,
        socialHandle.streamID,
      );
      expect(result).toEqual({ ...newSocialHandle, platform: "orcid" });
    });
  });

  describe("Attestations", async () => {
    const composeClient = freshClient();
    composeClient.setDID(await randomDID());
    const testClaim = await createClaim(composeClient, {
      title: "Test",
      description: "A nice explanation",
    });

    test("can be made to own profile", async () => {
      const user = await randomDID();
      composeClient.setDID(user);

      const ownProfile = await createProfile(composeClient, {
        displayName: "First Lastname",
      });

      const attestation = await createAttestation(composeClient, {
        targetID: ownProfile.streamID,
        targetVersion: ownProfile.commitID,
        claimID: testClaim.streamID,
        claimVersion: testClaim.commitID,
        revoked: false,
      });
      const result = await queryAttestation(
        composeClient,
        attestation.streamID,
      );
      expect(result?.targetID).toEqual(ownProfile.streamID);
      expect(result?.targetVersion).toEqual(ownProfile.commitID);
    });

    test("can be made to other users research object", async () => {
      const user1 = await randomDID();
      composeClient.setDID(user1);
      const user1ResearchObject = await createResearchObject(composeClient, {
        title: "Paper",
        manifest: A_CID,
      });

      const user2 = await randomDID();
      composeClient.setDID(user2);
      const attestation = await createAttestation(composeClient, {
        targetID: user1ResearchObject.streamID,
        targetVersion: user1ResearchObject.commitID,
        claimID: testClaim.streamID,
        claimVersion: testClaim.commitID,
        revoked: false,
      });
      const result = await queryAttestation(
        composeClient,
        attestation.streamID,
      );
      expect(result?.targetID).toEqual(user1ResearchObject.streamID);
      expect(result?.targetVersion).toEqual(user1ResearchObject.commitID);
    });

    test("can be updated with revokation", async () => {
      const user = await randomDID();
      composeClient.setDID(user);
      const researchObject = await createResearchObject(composeClient, {
        title: "Paper",
        manifest: A_CID,
      });

      const attestation = await createAttestation(composeClient, {
        targetID: researchObject.streamID,
        targetVersion: researchObject.commitID,
        claimID: testClaim.streamID,
        claimVersion: testClaim.commitID,
        revoked: false,
      });

      await waitAndSync(attestation.streamID);
      await updateAttestation(composeClient, {
        id: attestation.streamID,
        revoked: true,
      });

      const result = await queryAttestation(
        composeClient,
        attestation.streamID,
      );
      expect(result?.revoked).toEqual(true);
    });
  });

  describe("Annotations", async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    const researchObject = await createResearchObject(composeClient, {
      title: "Title",
      manifest: A_CID,
    });

    const claim = await createClaim(composeClient, {
      title: "Title",
      description: "Description",
    });

    const researchComponent = await createResearchComponent(composeClient, {
      name: "Name",
      mimeType: "text/csv",
      dagNode: A_CID,
      pathToNode: "",
      researchObjectID: researchObject.streamID,
      researchObjectVersion: researchObject.commitID,
    });

    describe("can be created on", async () => {
      test("research object", async () => {
        const data: Annotation = {
          comment: "This is a cool object!",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryAnnotation(
          composeClient,
          annotation.streamID,
        );
        expect(response).toMatchObject(data);
      });

      test("research component", async () => {
        const data: Annotation = {
          comment: "What a component!",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          targetID: researchComponent.streamID,
          targetVersion: researchComponent.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryAnnotation(
          composeClient,
          annotation.streamID,
        );
        expect(response).toMatchObject(data);
      });

      test("raw dagNode", async () => {
        const data: Annotation = {
          comment: "What a file!",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          dagNode: A_CID,
          pathToNode: "files/data.csv",

          claimID: claim.streamID,
          claimVersion: claim.commitID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryAnnotation(
          composeClient,
          annotation.streamID,
        );
        expect(response).toMatchObject(data);
      });
    });

    describe("can suggest metadata on", async () => {
      test("research object", async () => {
        const data: Annotation = {
          comment: "Adding some metadata to research object",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,

          metadataPayload: A_CID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryAnnotation(
          composeClient,
          annotation.streamID,
        );
        expect(response?.metadataPayload).toEqual(A_CID);
      });

      test("component", async () => {
        const data: Annotation = {
          comment: "Adding some metadata to component",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          targetID: researchComponent.streamID,
          targetVersion: researchComponent.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,

          metadataPayload: A_CID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryAnnotation(
          composeClient,
          annotation.streamID,
        );
        expect(response?.metadataPayload).toEqual(A_CID);
      });

      test("raw dagNode", async () => {
        const data: Annotation = {
          comment: "Adding some metadata to DAG",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          dagNode: A_CID,
          pathToNode: "files/data.csv",

          claimID: claim.streamID,
          claimVersion: claim.commitID,

          metadataPayload: A_CID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryAnnotation(
          composeClient,
          annotation.streamID,
        );
        expect(response?.metadataPayload).toEqual(A_CID);
      });
    });

    test.skip("can be made without claim", async () => {
      // API error on @relationDocument when claimID omitted even if optional,
      // under review by ceramic devs.
      // When fixed, remove unnecessary claims and make this a separate case
      const data: Annotation = {
        comment: "This is a cool object!",

        researchObjectID: researchObject.streamID,
        researchObjectVersion: researchObject.commitID,
      };

      const annotation = await createAnnotation(composeClient, data);

      const response = await queryAnnotation(
        composeClient,
        annotation.streamID,
      );
      expect(response).toEqual(data);
    });

    describe("can be found from", async () => {
      test("research object", async () => {
        const data: Annotation = {
          comment: "This is a cool object!",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,
        };

        const annotation = await createAnnotation(composeClient, data);
        const response = await queryResearchObject(
          composeClient,
          researchObject.streamID,
          `
            annotations(first: 10) {
              edges {
                node {
                  researchObjectID
                  researchObjectVersion
                  id
                }
              }
            }
          `,
        );
        const expected = {
          node: {
            researchObjectID: researchObject.streamID,
            researchObjectVersion: researchObject.commitID,
            id: annotation.streamID,
          },
        };
        expect((response as any).annotations.edges).toContainEqual(expected);
      });

      test("research component", async () => {
        const data: Annotation = {
          comment: "This is a cool component!",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          targetID: researchComponent.streamID,
          targetVersion: researchComponent.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,
        };

        const annotation = await createAnnotation(composeClient, data);

        const response = await queryResearchComponent(
          composeClient,
          researchComponent.streamID,
          `
            annotations(first: 10) {
              edges {
                node {
                  targetID
                  targetVersion
                  id
                }
              }
            }
          `,
        );
        const expected = {
          node: {
            targetID: researchComponent.streamID,
            targetVersion: researchComponent.commitID,
            id: annotation.streamID,
          },
        };
        expect((response as any).annotations.edges).toContainEqual(expected);
      });
    });

    test("can reply to another annotation", async () => {
      const questionData: Annotation = {
        comment: "What do you tink about this?",

        researchObjectID: researchObject.streamID,
        researchObjectVersion: researchObject.commitID,

        targetID: researchComponent.streamID,
        targetVersion: researchComponent.commitID,

        claimID: claim.streamID,
        claimVersion: claim.commitID,
      };

      const question = await createAnnotation(composeClient, questionData);

      const replyData: Annotation = {
        comment: "Looks good!",

        researchObjectID: researchObject.streamID,
        researchObjectVersion: researchObject.commitID,

        targetID: question.streamID,
        targetVersion: question.commitID,

        claimID: claim.streamID,
        claimVersion: claim.commitID,
      };

      const reply = await createAnnotation(composeClient, replyData);

      const replyFromQuestion = await queryAnnotation(
        composeClient,
        question.streamID,
        `
          replies(first: 10) {
            edges {
              node {
                id
              }
            }
          }
        `,
      );

      // Verify that we can get the replies from the question
      const expectedReply = { node: { id: reply.streamID } };
      expect((replyFromQuestion as any).replies.edges).toContainEqual(
        expectedReply,
      );
    });
  });

  describe("Contributor relations", async () => {
    const composeClient = freshClient();
    const user1 = await randomDID();
    composeClient.setDID(user1);

    const user1Profile = await createProfile(composeClient, {
      displayName: "Name",
    });

    const user2 = await randomDID();
    composeClient.setDID(user2);

    const researchObject = await createResearchObject(composeClient, {
      title: "Title",
      manifest: A_CID,
    });

    const contributionData: ContributorRelation = {
      role: "Author",
      contributorID: user1Profile.streamID,
      researchObjectID: researchObject.streamID,
      researchObjectVersion: researchObject.commitID,
      revoked: false,
    };

    test("created", async () => {
      const contribution = await createContributorRelation(
        composeClient,
        contributionData,
      );
      const response = await queryContributorRelation(
        composeClient,
        contribution.streamID,
      );
      expect(response).toEqual(contributionData);
    });

    test("updated with revokation", async () => {
      const contribution = await createContributorRelation(
        composeClient,
        contributionData,
      );
      await updateContributorRelation(composeClient, {
        id: contribution.streamID,
        revoked: true,
      });

      const response = await queryContributorRelation(
        composeClient,
        contribution.streamID,
      );
      expect(response).toEqual({ ...contributionData, revoked: true });
    });

    test("found from research objects", async () => {
      const contribution = await createContributorRelation(
        composeClient,
        contributionData,
      );
      const response = await queryResearchObject(
        composeClient,
        researchObject.streamID,
        `
        contributors(first: 10) {
          edges {
            node {
              id
            }
          }
        } 
        `,
      );
      const expectedContribution = { node: { id: contribution.streamID } };
      expect((response as any).contributors.edges).toContainEqual(
        expectedContribution,
      );
    });

    test("found from profiles", async () => {
      const contribution = await createContributorRelation(
        composeClient,
        contributionData,
      );
      const response = await queryProfile(
        composeClient,
        user1Profile.streamID,
        `
        contributions(first: 10) {
          edges {
            node {
              id
            }
          }
        } 
        `,
      );
      const expectedContribution = { node: { id: contribution.streamID } };
      expect((response as any).contributions.edges).toContainEqual(
        expectedContribution,
      );
    });
  });

  describe("Reference relations can be", async () => {
    const composeClient = freshClient();
    const user1 = await randomDID();
    composeClient.setDID(user1);

    const researchObjectSource = await createResearchObject(composeClient, {
      title: "Title",
      manifest: A_CID,
    });

    const researchObjectTarget = await createResearchObject(composeClient, {
      title: "Title",
      manifest: A_CID,
    });

    const referenceData: ReferenceRelation = {
      fromID: researchObjectSource.streamID,
      fromVersion: researchObjectSource.commitID,
      toID: researchObjectTarget.streamID,
      toVersion: researchObjectTarget.commitID,
      revoked: false,
    };

    test("created", async () => {
      const reference = await createReferenceRelation(
        composeClient,
        referenceData,
      );
      const response = await queryReferenceRelation(
        composeClient,
        reference.streamID,
      );
      expect(response).toEqual(referenceData);
    });

    test("updated with revokation", async () => {
      const reference = await createReferenceRelation(
        composeClient,
        referenceData,
      );
      await updateReferenceRelation(composeClient, {
        id: reference.streamID,
        revoked: true,
      });
      const response = await queryReferenceRelation(
        composeClient,
        reference.streamID,
      );
      expect(response).toEqual({ ...referenceData, revoked: true });
    });

    test("found from source research objects", async () => {
      const reference = await createReferenceRelation(
        composeClient,
        referenceData,
      );
      const response = await queryResearchObject(
        composeClient,
        researchObjectSource.streamID,
        `
        outgoingReferences(first: 10) {
          edges {
            node {
              id
            }
          }
        } 
        `,
      );
      const expectedReference = { node: { id: reference.streamID } };
      expect((response as any).outgoingReferences.edges).toContainEqual(
        expectedReference,
      );
    });

    test("found from target research objects", async () => {
      const reference = await createReferenceRelation(
        composeClient,
        referenceData,
      );
      const response = await queryResearchObject(
        composeClient,
        researchObjectTarget.streamID,
        `
        incomingReferences(first: 10) {
          edges {
            node {
              id
            }
          }
        } 
        `,
      );
      const expectedReference = { node: { id: reference.streamID } };
      expect((response as any).incomingReferences.edges).toContainEqual(
        expectedReference,
      );
    });
  });

  describe("Research field", async () => {
    const composeClient = freshClient();
    const user1 = await randomDID();
    composeClient.setDID(user1);

    const researchObject = await createResearchObject(composeClient, {
      title: "Title",
      manifest: A_CID,
    });

    test("can be created", async () => {
      const field = await mutationCreateResearchField(composeClient, {
        title: "DeSci",
      });
      const response = await queryResearchFields(
        composeClient,
        field.streamID,
        "id title",
      );
      expect(response).toMatchObject({ title: "DeSci", id: field.streamID });
    });

    describe("relations", async () => {
      test("can be created", async () => {
        const field = await mutationCreateResearchField(composeClient, {
          title: "DeSci",
        });
        const relationData = {
          fieldID: field.streamID,
          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,
        };
        const relation = await createResearchFieldRelation(
          composeClient,
          relationData,
        );
        const response = await queryResearchFieldRelation(
          composeClient,
          relation.streamID,
        );
        expect(response).toMatchObject(relationData);
      });

      test("can be found from research object", async () => {
        const field = await mutationCreateResearchField(composeClient, {
          title: "DeSci",
        });
        const relation = await createResearchFieldRelation(composeClient, {
          fieldID: field.streamID,
          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,
        });
        const response = await queryResearchObject(
          composeClient,
          researchObject.streamID,
          `
          researchFields(first: 10) {
            edges {
              node {
                id
              }
            }
          }
          `,
        );
        const expectedRelation = { node: { id: relation.streamID } };
        expect((response as any).researchFields.edges).toContainEqual(
          expectedRelation,
        );
      });
    });
  });

  describe.todo("Queries can find", async () => {
    // Additional queries required to work
  });

  describe("System", async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    test("can get commits anchored before a certain time", async () => {
      // This assumes anchors have been made, which is very fast running locally
      // but are made in longer time periods with on-chain anchoring

      const { streamID } = await createResearchObject(composeClient, {
        title: "Old",
        manifest: A_CID,
      });
      const timeBetween = Math.floor(Date.now() / 1000);
      // Encourage an anchor in between commits
      await waitAndSync(streamID, 200);
      await updateResearchObject(composeClient, {
        id: streamID,
        title: "New",
      });

      const stream = await ceramic.loadStream(streamID);
      expect(stream.state.content.title).toEqual("New");

      const streamBetween = await loadAtTime(
        ceramic,
        StreamID.fromString(streamID),
        timeBetween,
      );
      expect(streamBetween.state.content.title).toEqual("Old");
    });

    test("can resolve stream refs in old versions", async () => {
      const researchObjectV0 = await createResearchObject(composeClient, {
        title: "Title",
        manifest: A_CID,
      });
      const componentV0 = await createResearchComponent(composeClient, {
        name: "Filename",
        mimeType: "text/plain",
        dagNode: A_CID,
        pathToNode: "files/data.csv",
        researchObjectID: researchObjectV0.streamID,
        researchObjectVersion: researchObjectV0.commitID,
      });
      const newManifest =
        "bafybeibeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const researchObjectV1 = await updateResearchObject(composeClient, {
        id: researchObjectV0.streamID,
        manifest: newManifest,
      });
      await waitAndSync(componentV0.streamID);
      await updateResearchComponent(composeClient, {
        id: componentV0.streamID,
        dagNode: newManifest,
        // Set a new version indicator
        researchObjectVersion: researchObjectV1.commitID,
      });

      // Verify that queries return the fresh data
      const roResult = await queryResearchObject(
        composeClient,
        researchObjectV0.streamID,
      );
      const rcResult = await queryResearchComponent(
        composeClient,
        componentV0.streamID,
      );
      expect(roResult?.manifest).toEqual(newManifest);
      expect(rcResult?.researchObjectID).toEqual(researchObjectV0.streamID);

      // Verify that we can still get the data of a specific version
      const oldComponentState = await ceramic.loadStream(componentV0.commitID);
      expect(oldComponentState.content.researchObjectVersion).toEqual(
        researchObjectV0.commitID,
      );
    });

    test("can resolve a specific version index", async () => {
      const data: ResearchObject = {
        title: "Title 0",
        manifest: A_CID,
      };

      // Create version 0
      const { streamID } = await createResearchObject(composeClient, data);
      await waitAndSync(streamID);

      // Create version 1
      await updateResearchObject(composeClient, {
        id: streamID,
        title: "Title 1",
      });
      await waitAndSync(streamID);

      // Create version 2
      await updateResearchObject(composeClient, {
        id: streamID,
        title: "Title 2",
      });
      await waitAndSync(streamID);

      const versionToResolve = 1;
      const streamAtV0 = await loadVersionIndex(
        ceramic,
        StreamID.fromString(streamID),
        versionToResolve,
      );

      expect(streamAtV0.content.title).toEqual("Title 1"); // yay
    });
  });
});

const freshClient = () =>
  new ComposeClient({
    ceramic,
    definition: definition as RuntimeCompositeDefinition,
  });

/** Sync between fast updates to same streams to make tests less flaky,
 * also allowing for an anchor commit to pop in between
 */
const waitAndSync = async (streamID: string, timeout?: number) => {
  await setTimeout(timeout || 150);
  const stream = await ceramic.loadStream(streamID);
  await stream.sync();
};

const _debugStream = async (streamID: string, message: string) => {
  const stream = await ceramic.loadStream(streamID);
  console.log(`*********** [START] ${message} ***********`);
  console.log(`LOG:`, JSON.stringify(stream.state.log, undefined, 2));
  console.log(`*********** [END]   ${message} ***********`);
};
