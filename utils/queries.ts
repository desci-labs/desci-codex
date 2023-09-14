import { ComposeClient } from "@composedb/client";
import { Attestation, Claim, Profile, ROProps } from "../types";

export const queryViewerId = async (composeClient: ComposeClient): Promise<string> => {
  const response = await composeClient.executeQuery<{viewer: { id: string}}>(`
    query {
      viewer {
        id
      }
    }`
  )
  if (response.errors || !response.data) {
    console.error("Error:", response.errors?.toString())
    throw new Error(`Failed to query viewer id!`)
  }
  return response.data.viewer.id
}

/**
 * Queries for the viewer profile, which could be null if authentication isn't done yet
*/
export const queryViewerProfile = async (composeClient: ComposeClient): Promise<Profile | null> => {
  const response = await composeClient.executeQuery<{ viewer: { profile: Profile | null} }>(`
    query {
      viewer {
        profile {
          id
          displayName
          orcid
        }
      }
    }`
  )
  if (response.errors || !response.data) {
    console.error("Error:", response.errors?.toString())
    throw new Error(`Failed to query viewer profile!`)
  }
  return response.data.viewer.profile
}

export const queryResearchObjects = async (composeClient: ComposeClient): Promise<ROProps[]> => {
  const response = await composeClient.executeQuery<
    { researchObjectIndex: { edges: { node: ROProps }[] } }
  >(`
    query {
      researchObjectIndex(first: 100) {
        edges {
          node {
            id
            title
            manifest
            owner {
              profile {
                displayName
                orcid
              }
            }
          }
        }
      }
    }
  `)
  if (response.errors || !response.data) {
    console.error("Error:", response.errors?.toString())
    throw new Error(`Failed to query research objects!`)
  }
  return response.data.researchObjectIndex.edges.map(e => e.node)
}

export const queryViewerResearchObjects = async (composeClient: ComposeClient): Promise<ROProps[]> => {
  const response = await composeClient.executeQuery<
    { viewer: { researchObjectList: { edges: { node: ROProps }[] } } }
  >(`
    query {
      viewer {
        researchObjectList(first: 100) {
          edges {
            node {
              id
              title
              manifest
            }
          }
        }
      }
    }
  `)
  if (response.errors || !response.data) {
    console.error("Error:", response.errors?.toString())
    throw new Error(`Failed to query viewer research objects!`)
  }
  return response.data.viewer.researchObjectList.edges.map(e => e.node)
}

export const queryResearchObjectAttestations = async (composeClient: ComposeClient, researchObjectID: string) => {
  const response = await composeClient.executeQuery<
    { node: { attestations: { edges: { node: Attestation }[] } } }
  >(`
    query ($id: ID!){
      node(id: $id) {
        ... on ResearchObject {
          attestations(first: 10) {
            edges {
              node {
                claim {
                  title
                }
                source {
                  profile {
                    displayName
                  }
                }
              }
            }
          }
        }
      }
    }
  `, { id: researchObjectID })
  if (response.errors || !response.data) {
    console.error("Error:", response.errors?.toString())
    throw new Error(`Failed to query attestations on research object ${researchObjectID}!`)
  }
  return response.data.node.attestations.edges.map(e => e.node)
}

export const mutationCreateResearchObject = async (composeClient: ComposeClient, inputs: ROProps): Promise<void> => {
  const response = await composeClient.executeQuery(`
    mutation ($title: String!, $manifest: InterPlanetaryCID!){
      createResearchObject(input: {
        content: {
          title: $title
          manifest: $manifest
        }
      })
      {
        document {
          title
          manifest
        }
      }
    }`,
    inputs
  )
  if (response.errors) {
    console.error("Error:", response.errors.toString())
    throw new Error("Failed to update research object!")
  }
}

export const mutationCreateProfile = async (composeClient: ComposeClient, inputs: Profile) => {
  const response = await composeClient.executeQuery(`
    mutation ($displayName: String!, $orcid: String!){
      createProfile(input: {
        content: {
          displayName: $displayName
          orcid: $orcid
        }
      })
      {
        document {
          displayName
          orcid
        }
      }
    }`,
    inputs
  )
  if (response.errors) {
    console.error("Error:", response.errors.toString())
    throw new Error("Failed to create profile!")
  }
}

export const mutationCreateClaim = async (composeClient: ComposeClient, inputs: Claim) => {
  const response = await composeClient.executeQuery(`
     mutation ($title: String!, $description: String!, $badge: InterPlanetaryCID){
      createClaim(input: {
        content: {
          title: $title
          description: $description
          badge: $badge
        }
      })
      {
        document {
          title
          description
          badge
        }
      }
    }
    `,
    inputs
  )
  if (response.errors) {
    console.error("Error:", response.errors.toString())
    throw new Error("Failed to create claim!")
  }
}

export const mutationCreateAttestation= async (composeClient: ComposeClient, inputs: Attestation) => {
  const response = await composeClient.executeQuery(`
     mutation ($targetID: CeramicStreamID!, $claimID: CeramicStreamID!, $revoked: Boolean!){
      createAttestation(input: {
        content: {
          targetID: $targetID
          claimID: $claimID
          revoked: $revoked
        }
      })
      {
        document {
          targetID
          claimID
          revoked
        }
      }
    }
    `,
    inputs
  )
  if (response.errors) {
    console.error("Error:", response.errors.toString())
    throw new Error("Failed to create attestation!")
  }
}