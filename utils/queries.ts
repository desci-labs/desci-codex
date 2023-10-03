import { ComposeClient } from "@composedb/client";
import { Attestation, Claim, ResearchComponent, Profile, ROProps, ContributorRelation, ReferenceRelation, ResearchFieldRelation } from "../types";
import { ExecutionResult } from "graphql";

export const queryViewerId = async (
  composeClient: ComposeClient
): Promise<string> => {
  const response = await composeClient.executeQuery<{viewer: { id: string}}>(`
    query {
      viewer {
        id
      }
    }`
  )
  assertQueryErrors(response, 'viewer id');
  return response.data!.viewer.id
}

/**
 * Queries for the viewer profile, which could be null if authentication isn't done yet
*/
export const queryViewerProfile = async (
  composeClient: ComposeClient
): Promise<Profile | null> => {
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
  assertQueryErrors(response, 'viewer profile')
  return response.data!.viewer.profile
}

export const queryViewerResearchObjects = async (
  composeClient: ComposeClient
): Promise<ROProps[]> => {
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
  assertQueryErrors(response, 'viewer research objects')
  return response.data!.viewer.researchObjectList.edges.map(e => e.node)
}

export const queryViewerClaims = async (
  composeClient: ComposeClient
): Promise<Claim[]> => {
  const response = await composeClient.executeQuery<
    { viewer:{ claimList: { edges: { node: Claim}[] } } }
  >(`
    query {
      viewer {
        claimList(first: 100) {
          edges {
            node {
              id
              title
              description 
              badge 
            }
          }
        }
      }
    }
  `)
  assertQueryErrors(response, 'viewer claims')
  return response.data!.viewer.claimList.edges.map(e => e.node)
}

export const queryResearchObjects = async (
  composeClient: ComposeClient
): Promise<ROProps[]> => {
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
  assertQueryErrors(response, 'research objects')
  return response.data!.researchObjectIndex.edges.map(e => e.node)
}

export const queryResearchObjectAttestations = async (
  composeClient: ComposeClient,
  researchObjectID: string
) => {
  const response = await composeClient.executeQuery<
    { node: { attestations: { edges: { node: Attestation }[] } } }
  >(`
    query ($id: ID!) {
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
  assertQueryErrors(response, `attestations on research object ${researchObjectID}`)
  return response.data!.node.attestations.edges.map(e => e.node)
}

export const mutationCreateResearchObject = async (
  composeClient: ComposeClient,
  inputs: ROProps
): Promise<string> => {
  const response = await composeClient.executeQuery<
      { createResearchObject: { document: { id: string } } }
    >(`
    mutation ($title: String!, $manifest: InterPlanetaryCID!){
      createResearchObject(input: {
        content: {
          title: $title
          manifest: $manifest
        }
      })
      {
        document {
          id
        }
      }
    }`,
    inputs
  )
  assertMutationErrors(response, 'create research object')
  return response.data!.createResearchObject.document.id
}

export const mutationCreateResearchComponent = async (
  composeClient: ComposeClient,
  inputs: ResearchComponent
): Promise<string> => {
  const response = await composeClient.executeQuery<
      { createResearchComponent: { document: { id: string } } }
    >(`
    mutation ($name: String!, $type: ResearchComponentComponentType!, $dagNode: InterPlanetaryCID!, $researchObjectID: CeramicStreamID!){
      createResearchComponent(input: {
        content: {
          name: $name
          type: $type
          dagNode: $dagNode
          researchObjectID: $researchObjectID
        }
      })
      {
        document {
          id
        }
      }
    }`,
    inputs
  )
  assertMutationErrors(response, 'create research object')
  return response.data!.createResearchComponent.document.id
}

export const mutationUpdateResearchObject = async (
  composeClient: ComposeClient,
  inputs: Partial<ROProps> & { id: string }
): Promise<void> => {
  const gqlParamTypes: Record<string, string> = {
    manifest: "InterPlanetaryCID",
    title: "String"
  };
  
  const [params, content] = getQueryFields(gqlParamTypes, inputs);
  const response = await composeClient.executeQuery(`
    mutation ($id: ID!, ${params}){
      updateResearchObject(input: {
        id: $id
        content: { ${content} }
      })
      {
        document {
          id
        }
      }
    }`,
    inputs
  )
  assertMutationErrors(response, 'update research object')
}

export const mutationCreateProfile = async (
  composeClient: ComposeClient,
  inputs: Profile
): Promise<string> => {
  const response = await composeClient.executeQuery<
      { createProfile: { document: { id: string } } }
    >(`
    mutation ($displayName: String!, $orcid: String){
      createProfile(input: {
        content: {
          displayName: $displayName
          orcid: $orcid
        }
      })
      {
        document {
          id
        }
      }
    }`,
    inputs
  )
  assertMutationErrors(response, 'create profile')
  return response.data!.createProfile.document.id
}

export const mutationCreateClaim = async (
  composeClient: ComposeClient,
  inputs: Claim
): Promise<string> => {
  const response = await composeClient.executeQuery<
      { createClaim: { document: { id: string } } }
    >(`
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
          id
        }
      }
    }
    `,
    inputs
  )
  assertMutationErrors(response, 'create claim')
  return response.data!.createClaim.document.id
}

export const mutationCreateAttestation = async (
  composeClient: ComposeClient, 
  inputs: Attestation
): Promise<string> => {
  const response = await composeClient.executeQuery<
      { createAttestation: { document: { id: string } } }
    >(`
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
          id
        }
      }
    }
    `,
    inputs
  );
  assertMutationErrors(response, 'create attestation')
  return response.data!.createAttestation.document.id
}

export const mutationUpdateAttestation = async (
  composeClient: ComposeClient, 
  inputs: Partial<Attestation> & { id: string }
): Promise<string> => {
  const gqlParamTypes: Record<string, string> = {
    targetID: "CeramicStreamID",
    claimID: "CeramicStreamID",
    revoked: "Boolean"
  };

  const [params, content] = getQueryFields(gqlParamTypes, inputs);
  const response = await composeClient.executeQuery<
      { updateAttestation: { document: { id: string } } }
    >(`
     mutation ($id: ID!, ${params}){
      updateAttestation(input: {
        id: $id
        content: { ${content} }
      })
      {
        document {
          id
        }
      }
    }
    `,
    inputs
  );
  assertMutationErrors(response, 'update attestation')
  return response.data!.updateAttestation.document.id
}

export const mutationCreateContributorRelation = async (
  composeClient: ComposeClient,
  inputs: ContributorRelation
): Promise<string> => {
  const response = await composeClient.executeQuery<
    { createContributorRelation: { document: { id: string }}}
  >(`
    mutation ($role: String!, $contributorID: CeramicStreamID!, $researchObjectID: CeramicStreamID!) {
      createContributorRelation(input: {
        content: {
          role: $role
          contributorID: $contributorID
          researchObjectID: $researchObjectID
        }
      })
      {
        document {
          id
        }
      }
    }
  `, inputs
  );
  assertMutationErrors(response, 'create contributor relation');
  return response.data!.createContributorRelation.document.id;
}

export const mutationCreateReferenceRelation = async (
  composeClient: ComposeClient,
  inputs: ReferenceRelation
): Promise<string> => {
  const response = await composeClient.executeQuery<
    { createReferenceRelation: { document: { id: string }}}
  >(`
    mutation ($fromID: CeramicStreamID!, $toID: CeramicStreamID!) {
      createReferenceRelation(input: {
        content: {
          fromID: $fromID
          toID: $toID
        }
      })
      {
        document {
          id
        }
      }
    }
  `, inputs
  );
  assertMutationErrors(response, 'create reference relation');
  return response.data!.createReferenceRelation.document.id;
}

export const mutationCreateResearchFieldRelation = async (
  composeClient: ComposeClient,
  inputs: ResearchFieldRelation
): Promise<string> => {
  const response = await composeClient.executeQuery<
    { createResearchFieldRelation: { document: { id: string }}}
  >(`
    mutation ($fieldID: CeramicStreamID!, $researchObjectID: CeramicStreamID!) {
      createResearchFieldRelation(input: {
        content: {
          researchObjectID: $researchObjectID
          fieldID: $fieldID
        }
      })
      {
        document {
          id
        }
      }
    }
  `, inputs
  );
  assertMutationErrors(response, 'create research field relation');
  return response.data!.createResearchFieldRelation.document.id;
}

export const mutationCreateResearchField = async (
  composeClient: ComposeClient,
  inputs: { title: string }
): Promise<string> => {
  const response = await composeClient.executeQuery<
    { createResearchField: { document: { id: string }}}
  >(`
    mutation ($title: String!) {
      createResearchField(input: {
        content: {
          title: $title
        }
      })
      {
        document {
          id
        }
      }
    }
  `, inputs
  );
  assertMutationErrors(response, 'create research field');
  return response.data!.createResearchField.document.id;
}

type SimpleMutationResult = Pick<ExecutionResult, 'errors'>
type SimpleQueryResult = Pick<ExecutionResult, 'errors' | 'data'>

const assertMutationErrors = (
  result: SimpleMutationResult,
  queryDescription: string
) => {
  if (result.errors) {
    console.error('Error:', result.errors.toString())
    throw new Error(`Mutation failed: ${queryDescription}`)
  }
}

const assertQueryErrors = (
  result: SimpleQueryResult,
  queryDescription: string
) => {
    if (result.errors || !result.data) {
        console.error("Error:", result.errors?.toString());
        throw new Error(`Query failed: ${queryDescription}!`);
    }
}

/** Get query parameters and doc content string depending on which
* input parameters are supplied. E.g. this input:
*   graphQLParamTypes = { field: "String!" }
*   inputs = { field: "hello"}
* would yield:
*   ["$field: String!", "field: $field"]
* which is what the GraphQL needs to put in the query/mutation parameters
* and the 'content' field, respectively.
*
* This function ignore any the id property because it need to be supplied
* in a special spot and for mutations only.
*/
const getQueryFields = (
  graphQLParamTypes: Record<string, string>,
  inputs: Record<string, unknown>
) =>
  Object.keys(inputs)
  .filter(p => p !== 'id')
  .reduce<[string[], string[]]>(
    (acc, next) => [
      [...acc[0], `$${next}: ${graphQLParamTypes[next]}`],
      [...acc[1], `${next}: $${next}`]
    ],
    [[],[]]
  ).map(stringArr => stringArr.join(', '));
