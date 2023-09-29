import KeyDIDResolver from "key-did-resolver"
import { Ed25519Provider } from "key-did-provider-ed25519"
import { DID } from "dids"
import { fromString } from "uint8arrays/from-string"
import templateData from "../template_data.json"
import { ComposeClient } from "@composedb/client"
import { mutationCreateClaim, mutationCreateProfile, mutationCreateResearchComponent, mutationCreateResearchObject } from "./queries"
import { CeramicClient } from "@ceramicnetwork/http-client"
import { definition } from '@/src/__generated__/definition'
import { RuntimeCompositeDefinition } from "@composedb/types"
import { ROProps, ResearchComponent } from "@/types"

const didFromSeed = async (seed: string) => {
  const keyResolver = KeyDIDResolver.getResolver();
  const key = fromString(seed, "base16")
  const did = new DID({
    provider: new Ed25519Provider(key),
    resolver: {
      ...keyResolver,
    },
  });
  await did.authenticate();
  return did
}

type ProfileIndexResults = { data: { profileIndex: { edges: []}}}
export const loadIfUninitialised = async (ceramic: CeramicClient) => {
  const composeClient = new ComposeClient(
    {
      ceramic,
      definition: definition as RuntimeCompositeDefinition
    }
  )
  const firstProfile = await composeClient.executeQuery(`
    query {
      profileIndex(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  `) as ProfileIndexResults

  if (firstProfile.data.profileIndex.edges.length === 0) {
    console.log("Profile index empty, loading template data...")
    await loadTemplateData(composeClient)
  } else {
    console.log("Found profiles in index, skipping template data initialisation.")
  }
}

/**
 * Iterates over template data file, and with a DID generated from each root entry
 * seed runs mutations to create instances of the data
**/
const loadTemplateData = async (composeClient: ComposeClient) => {
  for (const [seed, data] of Object.entries(templateData)) {
    composeClient.setDID(await didFromSeed(seed))
    const { profile, researchObjects, claims } = data
    await mutationCreateProfile(composeClient, profile)
    await Promise.all(researchObjects.map(
      async roTemplate => {
        const ro: ROProps = { 
          title: roTemplate.title,
          manifest: roTemplate.manifest
        }
        const researchObjectID = await mutationCreateResearchObject(composeClient, ro)
        roTemplate.components.map(async c => 
          mutationCreateResearchComponent(
            composeClient, 
            { 
              ...c,
              researchObjectID
            } as ResearchComponent
          )
        )
      }
    ))
    await Promise.all(claims.map(c => mutationCreateClaim(composeClient, c)))
  }
  console.log("Loading template data done!")
}
