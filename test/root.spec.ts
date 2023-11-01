import { ComposeClient } from "@composedb/client";
import { definition } from "../src/__generated__/definition";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { test, describe, beforeAll, expect } from "vitest";
import {
  mutationCreateAnnotation,
  mutationCreateAttestation,
  mutationCreateClaim,
  mutationCreateContributorRelation,
  mutationCreateProfile,
  mutationCreateReferenceRelation,
  mutationCreateResearchComponent,
  mutationCreateResearchField,
  mutationCreateResearchFieldRelation,
  mutationCreateResearchObject,
  mutationUpdateAttestation,
  mutationUpdateContributorRelation,
  mutationUpdateReferenceRelation,
  mutationUpdateResearchComponent,
  mutationUpdateResearchObject,
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
} from "../utils/queries";
import { randomDID } from "./util";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { writeComposite } from "scripts/composites.mjs";
import { setTimeout } from "timers/promises";
import {
  Annotation,
  Attestation,
  Claim,
  ContributorRelation,
  Profile,
  ReferenceRelation,
  ResearchObject,
} from "@/types";
import { CommitID } from "@ceramicnetwork/streamid";

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

    // Takes a spinner param which just screws with our test output
    await writeComposite({ info: () => {}, succeed: () => {} });
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
      const researchObject = await mutationCreateResearchObject(
        composeClient,
        data,
      );
      const result = await queryResearchObject(
        composeClient,
        researchObject.streamID,
      );
      expect(result).toEqual(data);
    });

    test("profile", async () => {
      const data: Profile = {
        displayName: "First Lastname",
        orcid: "orcidHandle",
      };
      const profile = await mutationCreateProfile(composeClient, data);

      const result = await queryProfile(composeClient, profile.streamID);
      expect(result).toEqual(data);
    });

    test("claim", async () => {
      const data: Claim = {
        title: "My Claim",
        description: "The point of the claim",
        badge: A_CID,
      };
      const claim = await mutationCreateClaim(composeClient, data);

      const result = await queryClaim(composeClient, claim.streamID);
      expect(result).toEqual(data);
    });

    test("attestation to own research object", async () => {
      const myResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: "Test",
          manifest: A_CID,
        },
      );
      const myClaim = await mutationCreateClaim(composeClient, {
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
      const attestation = await mutationCreateAttestation(composeClient, data);
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
      const researchObject = await mutationCreateResearchObject(
        composeClient,
        data,
      );

      await waitAndSync(researchObject.streamID);
      await mutationUpdateResearchObject(composeClient, {
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
      const profile = await mutationCreateProfile(composeClient, {
        displayName: "My Name",
        orcid: "@handle",
      });

      const newProfile: Profile = {
        displayName: "New Name",
        orcid: "@handle",
      };
      await waitAndSync(profile.streamID);
      // Apparently create acts as an upsert on SINGLE accountRelation models
      await mutationCreateProfile(composeClient, newProfile);

      const result = await queryProfile(composeClient, profile.streamID);
      expect(result).toEqual(newProfile);
    });
  });

  describe("Attestations", async () => {
    const composeClient = freshClient();
    composeClient.setDID(await randomDID());
    const testClaim = await mutationCreateClaim(composeClient, {
      title: "Test",
      description: "A nice explanation",
    });

    test("can be made to own profile", async () => {
      const user = await randomDID();
      composeClient.setDID(user);

      const ownProfile = await mutationCreateProfile(composeClient, {
        displayName: "First Lastname",
        orcid: "orcidHandle",
      });

      const attestation = await mutationCreateAttestation(composeClient, {
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
      const user1ResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: "Paper",
          manifest: A_CID,
        },
      );

      const user2 = await randomDID();
      composeClient.setDID(user2);
      const attestation = await mutationCreateAttestation(composeClient, {
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
      const researchObject = await mutationCreateResearchObject(composeClient, {
        title: "Paper",
        manifest: A_CID,
      });

      const attestation = await mutationCreateAttestation(composeClient, {
        targetID: researchObject.streamID,
        targetVersion: researchObject.commitID,
        claimID: testClaim.streamID,
        claimVersion: testClaim.commitID,
        revoked: false,
      });

      await waitAndSync(attestation.streamID);
      await mutationUpdateAttestation(composeClient, {
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

    const researchObject = await mutationCreateResearchObject(composeClient, {
      title: "Title",
      manifest: A_CID,
    });

    const claim = await mutationCreateClaim(composeClient, {
      title: "Title",
      description: "Description",
    });

    const researchComponent = await mutationCreateResearchComponent(
      composeClient,
      {
        name: "Name",
        mimeType: "text/csv",
        dagNode: A_CID,
        pathToNode: "",
        researchObjectID: researchObject.streamID,
        researchObjectVersion: researchObject.commitID,
      },
    );

    describe("can be created on", async () => {
      test("research object", async () => {
        const data: Annotation = {
          comment: "This is a cool object!",

          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID,

          claimID: claim.streamID,
          claimVersion: claim.commitID,
        };

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

      const annotation = await mutationCreateAnnotation(composeClient, data);

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

        const annotation = await mutationCreateAnnotation(composeClient, data);
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

        const annotation = await mutationCreateAnnotation(composeClient, data);

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

      const question = await mutationCreateAnnotation(
        composeClient,
        questionData,
      );

      const replyData: Annotation = {
        comment: "Looks good!",

        researchObjectID: researchObject.streamID,
        researchObjectVersion: researchObject.commitID,

        targetID: question.streamID,
        targetVersion: question.commitID,

        claimID: claim.streamID,
        claimVersion: claim.commitID,
      };

      const reply = await mutationCreateAnnotation(composeClient, replyData);

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

    const user1Profile = await mutationCreateProfile(composeClient, {
      displayName: "Name",
      orcid: "000-111",
    });

    const user2 = await randomDID();
    composeClient.setDID(user2);

    const researchObject = await mutationCreateResearchObject(composeClient, {
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
      const contribution = await mutationCreateContributorRelation(
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
      const contribution = await mutationCreateContributorRelation(
        composeClient,
        contributionData,
      );
      await mutationUpdateContributorRelation(composeClient, {
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
      const contribution = await mutationCreateContributorRelation(
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
      const contribution = await mutationCreateContributorRelation(
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

    const researchObjectSource = await mutationCreateResearchObject(
      composeClient,
      {
        title: "Title",
        manifest: A_CID,
      },
    );

    const researchObjectTarget = await mutationCreateResearchObject(
      composeClient,
      {
        title: "Title",
        manifest: A_CID,
      },
    );

    const referenceData: ReferenceRelation = {
      fromID: researchObjectSource.streamID,
      fromVersion: researchObjectSource.commitID,
      toID: researchObjectTarget.streamID,
      toVersion: researchObjectTarget.commitID,
      revoked: false,
    };

    test("created", async () => {
      const reference = await mutationCreateReferenceRelation(
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
      const reference = await mutationCreateReferenceRelation(
        composeClient,
        referenceData,
      );
      await mutationUpdateReferenceRelation(composeClient, {
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
      const reference = await mutationCreateReferenceRelation(
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
      const reference = await mutationCreateReferenceRelation(
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

    const researchObject = await mutationCreateResearchObject(composeClient, {
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
        const relation = await mutationCreateResearchFieldRelation(
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
        const relation = await mutationCreateResearchFieldRelation(
          composeClient,
          {
            fieldID: field.streamID,
            researchObjectID: researchObject.streamID,
            researchObjectVersion: researchObject.commitID,
          },
        );
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

      const { streamID } = await mutationCreateResearchObject(composeClient, {
        title: "Old",
        manifest: A_CID,
      });
      const timeBetween = Math.floor(Date.now() / 1000);
      // Encourage an anchor in between commits
      await waitAndSync(streamID, 200);
      await mutationUpdateResearchObject(composeClient, {
        id: streamID,
        title: "New",
      });

      const stream = await ceramic.loadStream(streamID);
      expect(stream.state.content.title).toEqual("New");

      const streamBetween = await ceramic.loadStream(streamID, {
        atTime: timeBetween,
      });
      expect(streamBetween.state.content.title).toEqual("Old");
    });

    test("can resolve stream refs in old versions", async () => {
      const researchObjectV0 = await mutationCreateResearchObject(
        composeClient,
        {
          title: "Title",
          manifest: A_CID,
        },
      );
      const componentV0 = await mutationCreateResearchComponent(composeClient, {
        name: "Filename",
        mimeType: "text/plain",
        dagNode: A_CID,
        pathToNode: "files/data.csv",
        researchObjectID: researchObjectV0.streamID,
        researchObjectVersion: researchObjectV0.commitID,
      });
      const newManifest =
        "bafybeibeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const researchObjectV1 = await mutationUpdateResearchObject(
        composeClient,
        {
          id: researchObjectV0.streamID,
          manifest: newManifest,
        },
      );
      await waitAndSync(componentV0.streamID);
      await mutationUpdateResearchComponent(composeClient, {
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
      const { streamID } = await mutationCreateResearchObject(
        composeClient,
        data,
      );

      await waitAndSync(streamID);
      const V1 = await mutationUpdateResearchObject(composeClient, {
        id: streamID,
        title: "Title 1",
      });

      await waitAndSync(streamID);
      const V2 = await mutationUpdateResearchObject(composeClient, {
        id: streamID,
        title: "Title 2",
      });

      await waitAndSync(streamID);
      const versionToResolve = 1;
      const stream = await ceramic.loadStream(streamID);

      // Find n:th commit, excluding anchor commits
      const commitCID = stream.state.log
        .filter((c) => c.type !== 2)
        .map((c) => c.cid)
        .at(versionToResolve);

      expect(commitCID).not.toBeUndefined();
      const commit = CommitID.make(stream.id, commitCID!);

      // Load state as of the n:th data commit in the stream
      const streamAtV0 = await ceramic.loadStream(commit);
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

const debugStream = async (streamID: string, message: string) => {
  const stream = await ceramic.loadStream(streamID);
  console.log(`*********** [START] ${message} ***********`);
  console.log(`LOG:`, JSON.stringify(stream.state.log, undefined, 2));
  console.log(`*********** [END]   ${message} ***********`);
};
