import { ComposeClient } from '@composedb/client'
import { definition } from '../src/__generated__/definition'
import { RuntimeCompositeDefinition } from '@composedb/types'
import { test, describe, beforeAll, expect } from 'vitest'
import {
  mutationCreateAnnotation,
  mutationCreateAttestation,
  mutationCreateClaim,
  mutationCreateProfile,
  mutationCreateResearchComponent,
  mutationCreateResearchObject,
  mutationUpdateAttestation,
  mutationUpdateResearchComponent,
  mutationUpdateResearchObject,
  queryAnnotation,
  queryAttestation,
  queryClaim,
  queryProfile,
  queryResearchComponent,
  queryResearchObject
} from '../utils/queries'
import { randomDID } from './util'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { writeComposite } from 'scripts/composites.mjs'
import { setTimeout } from "timers/promises";
import { Annotation, Attestation, Claim, Profile, ResearchObject } from '@/types'

const CERAMIC_API = 'http:/localhost:7007'
const A_CID = 'bafybeibeaampol2yz5xuoxex7dxri6ztqveqrybzfh5obz6jrul5gb4cf4'

const ceramic = new CeramicClient(CERAMIC_API)

describe('ComposeDB nodes', () => {
  beforeAll(async () => {
    try {
      await fetch(`${CERAMIC_API}/api/v0`)
    } catch (e) {
      console.error('Failed connection to Ceramic. Run with "make test" or against live devserver!')
      process.exit(1)
    };

    // Takes a spinner param which just screws with our test output
    await writeComposite({ info: () => { }, succeed: () => { } });
  });

  describe('User', async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    // Create mutations error on failure and are otherwise successful
    test('can create research object', async () => {
      const data: ResearchObject = {
        title: 'Test',
        manifest: A_CID,
        metadata: '{ "key": "value" }'
      }
      const researchObject = await mutationCreateResearchObject(
        composeClient, data
      );
      const result = await queryResearchObject(
        composeClient, researchObject.streamID,
      );
      expect(result).toEqual(data);
    });

    test('can create profile', async () => {
      const data: Profile = {
        displayName: 'First Lastname',
        orcid: 'orcidHandle'
      };
      const profile = await mutationCreateProfile(composeClient, data);

      const result = await queryProfile(
        composeClient, profile.streamID,
      );
      expect(result).toEqual(data);
    });

    test('can create claim', async () => {
      const data: Claim = {
        title: 'My Claim',
        description: 'The point of the claim',
        badge: A_CID
      };
      const claim = await mutationCreateClaim(composeClient, data);

      const result = await queryClaim(composeClient, claim.streamID);
      expect(result).toEqual(data);
    });

    test('can attest to own research object', async () => {
      const myResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Test',
          manifest: A_CID
        }
      );
      const myClaim = await mutationCreateClaim(
        composeClient,
        {
          title: 'My Claim',
          description: 'The point of the claim',
          badge: A_CID
        }
      );
      const data: Attestation = {
        targetID: myResearchObject.streamID,
        targetVersion: myResearchObject.commitID,
        claimID: myClaim.streamID,
        claimVersion: myClaim.commitID,
        revoked: false
      };
      const attestation = await mutationCreateAttestation(composeClient, data);
      const result = await queryAttestation(composeClient, attestation.streamID);
      expect(result).toEqual(data);
    });
  });

  describe('Attestations', async () => {
    const composeClient = freshClient()
    composeClient.setDID(await randomDID())
    const testClaim = await mutationCreateClaim(
      composeClient,
      {
        title: 'Test',
        description: 'A nice explanation'
      }
    );

    test('can be made to own profile', async () => {
      const user = await randomDID();
      composeClient.setDID(user);

      const ownProfile = await mutationCreateProfile(
        composeClient,
        {
          displayName: 'First Lastname',
          orcid: 'orcidHandle'
        }
      );

      const attestation = await mutationCreateAttestation(
        composeClient,
        {
          targetID: ownProfile.streamID,
          targetVersion: ownProfile.commitID,
          claimID: testClaim.streamID,
          claimVersion: testClaim.commitID,
          revoked: false
        }
      );
      const result = await queryAttestation(composeClient, attestation.streamID);
      expect(result?.targetID).toEqual(ownProfile.streamID);
      expect(result?.targetVersion).toEqual(ownProfile.commitID);
    })

    test('can be made to other users research object', async () => {
      const user1 = await randomDID();
      composeClient.setDID(user1);
      const user1ResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Paper',
          manifest: A_CID
        }
      );

      const user2 = await randomDID();
      composeClient.setDID(user2);
      const attestation = await mutationCreateAttestation(
        composeClient,
        {
          targetID: user1ResearchObject.streamID,
          targetVersion: user1ResearchObject.commitID,
          claimID: testClaim.streamID,
          claimVersion: testClaim.commitID,
          revoked: false
        }
      );
      const result = await queryAttestation(composeClient, attestation.streamID);
      expect(result?.targetID).toEqual(user1ResearchObject.streamID);
      expect(result?.targetVersion).toEqual(user1ResearchObject.commitID);
    })

    test('can be updated with revokation', async () => {
      const user = await randomDID();
      composeClient.setDID(user);
      const researchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Paper',
          manifest: A_CID
        }
      );

      const attestation = await mutationCreateAttestation(
        composeClient,
        {
          targetID: researchObject.streamID,
          targetVersion: researchObject.commitID,
          claimID: testClaim.streamID,
          claimVersion: testClaim.commitID,
          revoked: false
        }
      );

      await waitAndSync(attestation.streamID);
      await mutationUpdateAttestation(
        composeClient,
        {
          id: attestation.streamID,
          revoked: true
        }
      );

      const result = await queryAttestation(composeClient, attestation.streamID);
      expect(result?.revoked).toEqual(true)
    })
  })

  describe('Annotations', async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    const researchObject = await mutationCreateResearchObject(
      composeClient,
      {
        title: 'Title',
        manifest: A_CID
      }
    );

    const claim = await mutationCreateClaim(
      composeClient,
      {
        title: 'Title',
        description: 'Description'
      }
    );

    const researchComponent = await mutationCreateResearchComponent(
      composeClient,
      {
        name: 'Name',
        mimeType: 'text/csv',
        dagNode: A_CID,
        researchObjectID: researchObject.streamID,
        researchObjectVersion: researchObject.commitID
      }
    );

    test('can be made on research object', async () => {
      const data: Annotation = {
        comment: 'This is a cool object!',
        targetID: researchObject.streamID,
        targetVersion: researchObject.commitID,
        claimID: claim.streamID,
        claimVersion: claim.commitID
      };

      const annotation = await mutationCreateAnnotation(composeClient, data);

      const response = await queryAnnotation(composeClient, annotation.streamID);
      expect(response).toEqual({ ...data, metadataPayload: null, path: null });
    });

    test('can be made on research component', async () => {
      const data: Annotation = {
        comment: 'This is a cool object!',
        targetID: researchComponent.streamID,
        targetVersion: researchComponent.commitID,
        claimID: claim.streamID,
        claimVersion: claim.commitID
      };

      const annotation = await mutationCreateAnnotation(composeClient, data);

      const response = await queryAnnotation(composeClient, annotation.streamID);
      expect(response).toEqual({ ...data, metadataPayload: null, path: null });
    });

    test('can attach metadata', async () => {
      const data: Annotation = {
        comment: 'This is a cool object!',
        targetID: researchComponent.streamID,
        targetVersion: researchComponent.commitID,
        claimID: claim.streamID,
        claimVersion: claim.commitID,
        metadataPayload: "JSONPatch"
      };

      const annotation = await mutationCreateAnnotation(composeClient, data);

      const response = await queryAnnotation(composeClient, annotation.streamID);
      expect(response?.metadataPayload).toEqual("JSONPatch");
    });

    test.skip('can omit claim', async () => {
      // API error on @relationDocument when the key is optional and omitted
      const data: Annotation = {
        comment: 'This is a cool object!',
        targetID: researchComponent.streamID,
        targetVersion: researchComponent.commitID
      };

      const annotation = await mutationCreateAnnotation(composeClient, data);

      const response = await queryAnnotation(composeClient, annotation.streamID);
      expect(response).toEqual(data);
    });

  });

  describe('User', async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    test('can update research object', async () => {
      const data: ResearchObject = {
        title: 'Test',
        manifest: A_CID,
        metadata: '{ "key": "value" }'
      };
      const researchObject = await mutationCreateResearchObject(composeClient, data);

      await waitAndSync(researchObject.streamID);
      const newMetadata = '{ "key": "value", "newKey": "value" }';
      await mutationUpdateResearchObject(
        composeClient,
        {
          id: researchObject.streamID,
          metadata: newMetadata
        }
      );

      const result = await queryResearchObject(composeClient, researchObject.streamID);
      expect(result).toEqual({ ...data, metadata: newMetadata });
    });

    test('can update profile', async () => {
      const profile = await mutationCreateProfile(
        composeClient,
        {
          displayName: "My Name",
          orcid: "@handle"
        }
      );

      const newProfile: Profile = {
        displayName: "New Name",
        orcid: "@handle"
      };
      await waitAndSync(profile.streamID);
      // Apparently create acts as an upsert on SINGLE accountRelation models
      await mutationCreateProfile(composeClient, newProfile);

      const result = await queryProfile(composeClient, profile.streamID);
      expect(result).toEqual(newProfile);
    });

  });

  describe('System', async () => {
    const composeClient = freshClient();
    const user = await randomDID();
    composeClient.setDID(user);

    test('can get commits anchored before a certain time', async () => {
      // This assumes anchors have been made, which is very fast running locally
      // but are made in longer time periods with on-chain anchoring

      const { streamID } = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Old',
          manifest: A_CID
        }
      );
      const timeBetween = Date.now();
      await waitAndSync(streamID);
      await mutationUpdateResearchObject(
        composeClient,
        {
          id: streamID,
          title: 'New'
        }
      );

      const stream = await ceramic.loadStream(streamID);
      expect(stream.state.content.title).toEqual('New');

      const streamBetween = await ceramic.loadStream(streamID, { atTime: timeBetween });
      expect(streamBetween.state.content.title).toEqual('Old');
    });

    test('can resolve stream refs in old versions', async () => {
      const researchObjectV0 = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Title',
          manifest: A_CID
        }
      );
      const componentV0 = await mutationCreateResearchComponent(
        composeClient,
        {
          name: 'Filename',
          mimeType: 'text/plain',
          dagNode: A_CID,
          researchObjectID: researchObjectV0.streamID,
          researchObjectVersion: researchObjectV0.commitID
        }
      );
      const newManifest = 'bafybeibeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const researchObjectV1 = await mutationUpdateResearchObject(
        composeClient,
        {
          id: researchObjectV0.streamID,
          manifest: newManifest
        }
      );
      await mutationUpdateResearchComponent(
        composeClient,
        {
          id: componentV0.streamID,
          dagNode: newManifest,
          // Set a new version indicator
          researchObjectVersion: researchObjectV1.commitID
        }
      );

      const roResult = await queryResearchObject(composeClient, researchObjectV0.streamID);
      const rcResult = await queryResearchComponent(composeClient, componentV0.streamID);
      expect(roResult?.manifest).toEqual(newManifest);
      expect(rcResult?.researchObjectID).toEqual(researchObjectV0.streamID);

      // Check that we can get the old state with the research object version at
      // that point in time
      const oldComponentState = await ceramic.loadStream(componentV0.commitID);
      expect(oldComponentState.content.researchObjectVersion)
        .toEqual(researchObjectV0.commitID);
    });
  });


})

const freshClient = () =>
  new ComposeClient({ ceramic, definition: definition as RuntimeCompositeDefinition })

/** Sync between fast updates to same streams to make tests less flaky,
* also allowing for an anchor commit to pop in between
*/
const waitAndSync = async (streamID: string) => {
  await setTimeout(100);
  const stream = await ceramic.loadStream(streamID);
  await stream.sync(); 
}
