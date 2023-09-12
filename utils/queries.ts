import { ComposeClient } from "@composedb/client";
import { Profile, ROProps } from "../types";
import { printError } from "graphql";

export const queryViewerId = async (composeClient: ComposeClient): Promise<string> => {
  const response = await composeClient.executeQuery<{viewer: { id: string}}>(`
    query {
      viewer {
        id
      }
    }`
  )
  if (response.errors || !response.data) {
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
    throw new Error(`Failed to query viewer research objects!`)
  }
  return response.data.viewer.researchObjectList.edges.map(e => e.node)
}

export const mutationUpdateResearchObject = async (composeClient: ComposeClient, inputs: ROProps): Promise<void> => {
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
    throw new Error("Failed to update research object!")
  }
}

export const mutationUpdateProfile = async (composeClient: ComposeClient, inputs: Profile) =>
  await composeClient.executeQuery(`
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