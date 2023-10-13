import { ComposeClient } from "@composedb/client";
import { Attestation, Claim, ResearchComponent, Profile, ResearchObject, ContributorRelation, ReferenceRelation, ResearchFieldRelation, ProtocolEntity, Annotation, NodeIDs, ResearchField } from "../types";
import { ExecutionResult } from "graphql";

export const queryViewerId = async (
  composeClient: ComposeClient
): Promise<string> => {
  const response = await composeClient.executeQuery<{ viewer: { id: string } }>(`
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
  const response = await composeClient.executeQuery<{ viewer: { profile: Profile | null } }>(`
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
): Promise<ResearchObject[]> => {
  const response = await composeClient.executeQuery<
    { viewer: { researchObjectList: { edges: { node: ResearchObject }[] } } }
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
    { viewer: { claimList: { edges: { node: Claim }[] } } }
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
): Promise<ResearchObject[]> => {
  const response = await composeClient.executeQuery<
    { researchObjectIndex: { edges: { node: ResearchObject }[] } }
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
  inputs: ResearchObject
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    title: "String!",
    manifest: "InterPlanetaryCID!",
    metadata: "String"
  },
  'createResearchObject'
);

export const mutationCreateResearchComponent = async (
  composeClient: ComposeClient,
  inputs: ResearchComponent
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    name: "String!",
    mimeType: "String!",
    dagNode: "InterPlanetaryCID!",
    researchObjectID: "CeramicStreamID!",
    researchObjectVersion: "CeramicCommitID!"
  },
  'createResearchComponent'
);

export const mutationUpdateResearchComponent = async (
  composeClient: ComposeClient,
  inputs: Partial<ResearchComponent> & { id: string }
): Promise<NodeIDs> => genericUpdate(
  composeClient,
  inputs,
  {
    name: "String!",
    mimeType: "String!",
    dagNode: "InterPlanetaryCID!",
    researchObjectID: "CeramicStreamID!",
    researchObjectVersion: "CeramicCommitID!"
  },
  'updateResearchComponent'
);

export const mutationUpdateResearchObject = async (
  composeClient: ComposeClient,
  inputs: Partial<ResearchObject> & { id: string }
): Promise<NodeIDs> => genericUpdate(
  composeClient,
  inputs,
  {
    manifest: "InterPlanetaryCID",
    title: "String",
    metadata: "String"
  },
  'updateResearchObject'
);

export const mutationCreateProfile = async (
  composeClient: ComposeClient,
  inputs: Profile
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    displayName: "String!",
    orcid: "String"
  },
  'createProfile',
  true
);

export const mutationCreateClaim = async (
  composeClient: ComposeClient,
  inputs: Claim
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    title: "String!",
    description: "String!",
    badge: "InterPlanetaryCID!",
  },
  'createClaim'
);

export const mutationCreateAttestation = async (
  composeClient: ComposeClient,
  inputs: Attestation
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    targetID: "CeramicStreamID!",
    targetVersion: "CeramicCommitID!",
    claimID: "CeramicStreamID!",
    claimVersion: "CeramicCommitID!",
    revoked: "Boolean"
  },
  'createAttestation'
);

export const mutationUpdateAttestation = async (
  composeClient: ComposeClient,
  inputs: Partial<Attestation> & { id: string }
): Promise<NodeIDs> => genericUpdate(
  composeClient,
  inputs,
  {
    targetID: "CeramicStreamID!",
    claimID: "CeramicStreamID!",
    revoked: "Boolean"
  },
  'updateAttestation'
);

export const mutationCreateAnnotation = async (
  composeClient: ComposeClient,
  inputs: Annotation
): Promise<NodeIDs> => {
  return genericCreate(
  composeClient,
  inputs,
  {
    comment: "String!",
    path: "String",
    metadataPayload: "String",
    targetID: "CeramicStreamID!",
    targetVersion: "CeramicCommitID!",
    claimID: "CeramicStreamID",
    claimVersion: "CeramicCommitID"
  },
  'createAnnotation'
);
}

export const mutationCreateContributorRelation = async (
  composeClient: ComposeClient,
  inputs: ContributorRelation
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    role: "String!",
    contributorID: "CeramicStreamID!",
    researchObjectID: "CeramicStreamID!",
    researchObjectVersion: "CeramicCommitID!"
  },
  'createContributorRelation'
);

export const mutationCreateReferenceRelation = async (
  composeClient: ComposeClient,
  inputs: ReferenceRelation
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    toID: "CeramicStreamID!",
    toVersion: "CeramicCommitID!",
    fromID: "CeramicStreamID!",
    fromVersion: "CeramicCommitID!"
  },
  'createReferenceRelation'
);

export const mutationCreateResearchFieldRelation = async (
  composeClient: ComposeClient,
  inputs: ResearchFieldRelation
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    fieldID: "CeramicStreamID!",
    researchObjectID: "CeramicStreamID!",
    researchObjectVersion: "CeramicCommitID!"
  },
  'createResearchFieldRelation'
);

export const mutationCreateResearchField = async (
  composeClient: ComposeClient,
  inputs: ResearchField
): Promise<NodeIDs> => genericCreate(
  composeClient,
  inputs,
  {
    title: "String!",
  },
  'createResearchField'
);

export const queryResearchObject = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string
): Promise<ResearchObject | undefined> => genericEntityQuery(
  composeClient,
  id,
  'ResearchObject',
  selection ?? 
    `
      title
      manifest
      metadata
    `
);

export const queryProfile = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string
): Promise<Profile | undefined> => genericEntityQuery(
  composeClient,
  id,
  'Profile',
  selection ??
    `
      displayName
      orcid
    `
);

export const queryClaim = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string
): Promise<Claim| undefined> => genericEntityQuery(
  composeClient,
  id,
  'Claim',
  selection ??
    `
      title
      description
      badge
    `
);

export const queryAttestation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string
): Promise<Attestation | undefined> => genericEntityQuery(
  composeClient,
  id,
  'Attestation',
  selection ??
    `
      targetID
      targetVersion
      claimID
      claimVersion
      revoked
    `
);

export const queryResearchComponent = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string
): Promise<ResearchComponent | undefined> => genericEntityQuery(
  composeClient,
  id,
  'ResearchComponent',
  selection ??
    `
      name
      mimeType
      dagNode
      researchObjectID
      researchObjectVersion
    `
);

export const queryAnnotation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string
): Promise<Annotation | undefined> => genericEntityQuery(
  composeClient,
  id,
  'Annotation',
  selection ??
    `
      comment
      path
      targetID
      targetVersion
      claimID
      claimVersion
      metadataPayload
    `
);

export async function genericEntityQuery<T extends ProtocolEntity>(
  composeClient: ComposeClient,
  id: string,
  entityName: string,
  // Specify the field structure to query for
  selection: string
): Promise<T | undefined> {
  const query = `
  query($id: ID!) {
    node(id: $id) {
      ...on ${entityName} {
        ${selection}
      }
    }
  }
  `;
  const result = await composeClient.executeQuery(query, { id })
  assertQueryErrors(result, `${entityName} node`)
  return result.data
    ? result.data.node as T
    : undefined // query can return null too, downscope type
};

async function genericCreate<T extends ProtocolEntity>(
  composeClient: ComposeClient,
  inputs: T,
  /** At least verify all keys exist in T, can still forget one though.
  * Can't require it fully because some props are not allowed in the mutation.
  */
  gqlTypes: Partial<Record<keyof T, string>>,
  mutationName: string,
  /** Skip timeout for single accountRelation entities */
  noTimeout?: boolean
): Promise<NodeIDs> {
  const [params, content] = getQueryFields(gqlTypes as Record<string, string>, inputs);
  const response = await composeClient.executeQuery(`
    mutation( ${params} ) {
      ${mutationName}(input: {
        content: { ${content} }
        ${noTimeout ? "options: { syncTimeout: 0 }" : ""}
      })
      {
        document {
          id
          version
        }
      }
    }`, inputs
  ) as any;
  assertMutationErrors(response, mutationName);
  const nodeIDs: NodeIDs = {
    streamID: response.data[mutationName].document.id,
    commitID: response.data[mutationName].document.version
  };
  return nodeIDs;
};

async function genericUpdate<T extends ProtocolEntity>(
  composeClient: ComposeClient,
  inputs: Partial<T> & { id: string },
  // See note in genericCreate
  gqlTypes: Partial<Record<keyof T, string>>,
  mutationName: string,
): Promise<NodeIDs> {
  const [params, content] = getQueryFields(gqlTypes as Record<string, string>, inputs);
  const response = await composeClient.executeQuery(`
    mutation($id: ID!, ${params} ) {
      ${mutationName}(
        input: {
          id: $id
          content: { ${content} }
        }
      )
      {
        document {
          id
          version
        }
      }
    }`, inputs
  ) as any;
  assertMutationErrors(response, mutationName);
  const nodeIDs: NodeIDs = {
    streamID: response.data[mutationName].document.id,
    commitID: response.data[mutationName].document.version
  };
  return nodeIDs;
}

type SimpleMutationResult = Pick<ExecutionResult, 'errors'>
type SimpleQueryResult = Pick<ExecutionResult, 'errors' | 'data'>

const assertMutationErrors = (
  result: SimpleMutationResult,
  queryDescription: string
) => {
  if (result.errors) {
    console.error('Error:', result.errors.toString());
    throw new Error(`Mutation failed: ${queryDescription}`)
  };
}

const assertQueryErrors = (
  result: SimpleQueryResult,
  queryDescription: string
) => {
  if (result.errors || !result.data) {
    console.error("Error:", result.errors?.toString());
    throw new Error(`Query failed: ${queryDescription}!`);
  };
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
      [[], []]
    ).map(stringArr => stringArr.join(', '));
