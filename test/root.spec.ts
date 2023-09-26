import { ComposeClient } from '@composedb/client'
import { definition } from '@/src/__generated__/definition'
import { RuntimeCompositeDefinition } from '@composedb/types'
import { test, describe, beforeAll } from 'vitest'
import {
  mutationCreateAttestation, mutationCreateClaim, mutationCreateProfile,
  mutationCreateResearchObject, queryViewerClaims, queryViewerResearchObjects
} from '../utils/queries'
import { randomDID } from './util'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { writeComposite } from 'scripts/composites.mjs'
import { DID } from 'dids'

const CERAMIC_API = 'http:/localhost:7007'
const TIMEOUT = 7000
const A_CID = 'bafybeibeaampol2yz5xuoxex7dxri6ztqveqrybzfh5obz6jrul5gb4cf4'

const ceramic = new CeramicClient(CERAMIC_API)

describe('ComposeDB nodes', () => {
  beforeAll(async () => {
    try {
      await fetch(`${CERAMIC_API}/api/v0`)
    } catch (e) {
      console.error('Failed connection to Ceramic. Run with "make test" or against live devserver!')
      process.exit(1)
    }

    // Takes a spinner param which just screws with our test output
    await writeComposite({ info: () => { }, succeed: () => { } })
  })

  describe('Single user creation', async () => {
    const composeClient = freshClient()
    const user = await randomDID()
    composeClient.setDID(user)

    // Create mutations error on failure and are otherwise successful
    test('research object', async () =>
      await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Test',
          manifest: A_CID
        }
      )
    )

    test('profile', async () =>
      await mutationCreateProfile(
        composeClient,
        {
          displayName: 'First Lastname',
          orcid: 'orcidHandle'
        }
      )
      // No idea why this one takes 3 seconds :shrug:
      , TIMEOUT)

    test('claim', async () =>
      await mutationCreateClaim(
        composeClient,
        {
          title: 'My Claim',
          description: 'The point of the claim',
          badge: A_CID
        }
      )
    )

    test('attestation to own research object', async () => {
      const myResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Test',
          manifest: A_CID
        }
      )
      const myClaim = await mutationCreateClaim(
        composeClient,
        {
          title: 'My Claim',
          description: 'The point of the claim',
          badge: A_CID
        }
      )
      await mutationCreateAttestation(
        composeClient,
        {
          targetID: myResearchObject,
          claimID: myClaim,
          revoked: false
        }
      )
    })

    test('organization', async () => {
      // pending membership modelling
    })
  })

  describe('Attest', async () => {
    const composeClient = freshClient()

    test.todo('to self', async () => {
      const user = await randomDID()
      composeClient.setDID(user) 
      const claim = await mutationCreateClaim(
        composeClient,
        {
          title: 'Cool',
          description: 'Very interesting person'
        }
      )
      // TODO update claim
    })

    test('other users research object', async () => {
      const user1 = await randomDID()
      composeClient.setDID(user1)
      const user1ResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Paper',
          manifest: A_CID
        }
      )

      const user2 = await randomDID()
      composeClient.setDID(user2)
      const user2Claim = await mutationCreateClaim(
        composeClient,
        {
          title: 'Great',
          description: 'Incredibly nice work'
        }
      )
      await mutationCreateAttestation(
        composeClient,
        {
          targetID: user1ResearchObject,
          claimID: user2Claim,
          revoked: false
        }
      )
    })

    test('revokation', async () => {
      const user = await randomDID()
      composeClient.setDID(user)
      const user1ResearchObject = await mutationCreateResearchObject(
        composeClient,
        {
          title: 'Paper',
          manifest: A_CID
        }
      )

      const user2 = await randomDID()
      composeClient.setDID(user2)
      const user2Claim = await mutationCreateClaim(
        composeClient,
        {
          title: 'Great',
          description: 'Incredibly nice work'
        }
      )
      await mutationCreateAttestation(
        composeClient,
        {
          targetID: user1ResearchObject,
          claimID: user2Claim,
          revoked: false
        }
      )
    })
  })

  describe('Updating objects', async () => {
    test.todo('')
  })

  describe('Querying relations', async () => {
    test.todo('')
  })
})

const freshClient = () =>
  new ComposeClient({ceramic, definition: definition as RuntimeCompositeDefinition})
