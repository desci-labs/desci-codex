import { ComposeClient } from "@composedb/client";
import {
  Attestation,
  Claim,
  ResearchComponent,
  Profile,
  ResearchObject,
  ContributorRelation,
  ReferenceRelation,
  ResearchFieldRelation,
  ProtocolEntity,
  Annotation,
  NodeIDs,
  ResearchField,
  PartialWithID,
  AnnotationUpdate,
  DefaultViews,
  AnnotationQueryResult,
  ResearchComponentQueryResult,
  AttestationQueryResult,
  ClaimQueryResult,
  ProfileQueryResult,
  ResearchObjectQueryResult,
  ContributorQueryResult,
  ReferenceQueryResult,
  ResearchFieldQueryResult,
  ResearchFieldRelationQueryResult,
} from "./types.js";
import { ExecutionResult } from "graphql";
import * as gql from "gql-query-builder";

export const queryResearchObjects = async (
  composeClient: ComposeClient,
): Promise<ResearchObject[]> => {
  const response = await composeClient.executeQuery<{
    researchObjectIndex: { edges: { node: ResearchObject }[] };
  }>(
    gql.query({
      operation: "researchObjectIndex",
      fields: [
        {
          edges: {
            node: ["id", "title", "manifest"],
          },
        },
      ],
    }).query,
  );
  assertQueryErrors(response, "research objects");
  return response.data!.researchObjectIndex.edges.map((e) => e.node);
};

export const queryResearchObjectAttestations = async (
  composeClient: ComposeClient,
  researchObjectID: string,
) => {
  const response = await composeClient.executeQuery<{
    node: { attestations: { edges: { node: Attestation }[] } };
  }>(
    `
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
  `,
    { id: researchObjectID },
  );
  assertQueryErrors(
    response,
    `attestations on research object ${researchObjectID}`,
  );
  return response.data!.node.attestations.edges.map((e) => e.node);
};

const RO_TYPE_MAP = {
  title: "String!",
  manifest: "InterPlanetaryCID!",
  metadata: "InterPlanetaryCID",
};

export const mutationCreateResearchObject = async (
  composeClient: ComposeClient,
  inputs: ResearchObject,
): Promise<NodeIDs> =>
  genericCreate(composeClient, inputs, RO_TYPE_MAP, "createResearchObject");

export const mutationUpdateResearchObject = async (
  composeClient: ComposeClient,
  inputs: PartialWithID<ResearchObject>,
): Promise<NodeIDs> =>
  genericUpdate(
    composeClient,
    inputs,
    makeAllOptional(RO_TYPE_MAP),
    "updateResearchObject",
  );

const COMPONENT_TYPE_MAP = {
  name: "String!",
  mimeType: "String!",
  metadata: "InterPlanetaryCID",
  dagNode: "InterPlanetaryCID!",
  pathToNode: "String!",
  researchObjectID: "CeramicStreamID!",
  researchObjectVersion: "CeramicCommitID!",
};

export const mutationCreateResearchComponent = async (
  composeClient: ComposeClient,
  inputs: ResearchComponent,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    COMPONENT_TYPE_MAP,
    "createResearchComponent",
  );

export const mutationUpdateResearchComponent = async (
  composeClient: ComposeClient,
  inputs: PartialWithID<ResearchComponent>,
): Promise<NodeIDs> =>
  genericUpdate(
    composeClient,
    inputs,
    makeAllOptional(COMPONENT_TYPE_MAP),
    "updateResearchComponent",
  );

export const mutationCreateProfile = async (
  composeClient: ComposeClient,
  inputs: Profile,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    {
      displayName: "String!",
      orcid: "String",
    },
    "createProfile",
    true,
  );

export const mutationCreateClaim = async (
  composeClient: ComposeClient,
  inputs: Claim,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    {
      title: "String!",
      description: "String!",
      badge: "InterPlanetaryCID!",
    },
    "createClaim",
  );

const ATTESTATION_TYPE_MAP = {
  targetID: "CeramicStreamID!",
  targetVersion: "CeramicCommitID!",
  claimID: "CeramicStreamID!",
  claimVersion: "CeramicCommitID!",
  revoked: "Boolean",
};

export const mutationCreateAttestation = async (
  composeClient: ComposeClient,
  inputs: Attestation,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    ATTESTATION_TYPE_MAP,
    "createAttestation",
  );

export const mutationUpdateAttestation = async (
  composeClient: ComposeClient,
  inputs: PartialWithID<Attestation>,
): Promise<NodeIDs> =>
  genericUpdate(
    composeClient,
    inputs,
    makeAllOptional(ATTESTATION_TYPE_MAP),
    "updateAttestation",
  );

const ANNOTATION_TYPE_MAP = {
  comment: "String!",
  researchObjectID: "CeramicStreamID!",
  researchObjectVersion: "CeramicCommitID!",
  targetID: "CeramicStreamID!",
  targetVersion: "CeramicCommitID!",
  dagNode: "InterPlanetaryCID",
  pathToNode: "String",
  locationOnFile: "String",
  claimID: "CeramicStreamID",
  claimVersion: "CeramicCommitID",
  metadataPayload: "InterPlanetaryCID",
};

export const mutationCreateAnnotation = async (
  composeClient: ComposeClient,
  inputs: Annotation,
): Promise<NodeIDs> =>
  genericCreate(composeClient, inputs, ANNOTATION_TYPE_MAP, "createAnnotation");

export const mutationUpdateAnnotation = async (
  composeClient: ComposeClient,
  inputs: PartialWithID<AnnotationUpdate>,
): Promise<NodeIDs> =>
  genericUpdate(
    composeClient,
    inputs,
    makeAllOptional(ANNOTATION_TYPE_MAP),
    "createAnnotation",
  );

const CONTRIBUTOR_TYPE_MAP = {
  role: "String!",
  contributorID: "CeramicStreamID!",
  researchObjectID: "CeramicStreamID!",
  researchObjectVersion: "CeramicCommitID!",
  revoked: "Boolean!",
};
export const mutationCreateContributorRelation = async (
  composeClient: ComposeClient,
  inputs: ContributorRelation,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    CONTRIBUTOR_TYPE_MAP,
    "createContributorRelation",
  );

export const mutationUpdateContributorRelation = async (
  composeClient: ComposeClient,
  inputs: PartialWithID<ContributorRelation>,
): Promise<NodeIDs> =>
  genericUpdate(
    composeClient,
    inputs,
    makeAllOptional(CONTRIBUTOR_TYPE_MAP),
    "updateContributorRelation",
  );

const REFERENCE_TYPE_MAP = {
  toID: "CeramicStreamID!",
  toVersion: "CeramicCommitID!",
  fromID: "CeramicStreamID!",
  fromVersion: "CeramicCommitID!",
  revoked: "Boolean!",
};

export const mutationCreateReferenceRelation = async (
  composeClient: ComposeClient,
  inputs: ReferenceRelation,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    REFERENCE_TYPE_MAP,
    "createReferenceRelation",
  );

export const mutationUpdateReferenceRelation = async (
  composeClient: ComposeClient,
  inputs: PartialWithID<ReferenceRelation>,
): Promise<NodeIDs> =>
  genericUpdate(
    composeClient,
    inputs,
    makeAllOptional(REFERENCE_TYPE_MAP),
    "updateReferenceRelation",
  );

export const mutationCreateResearchFieldRelation = async (
  composeClient: ComposeClient,
  inputs: ResearchFieldRelation,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    {
      fieldID: "CeramicStreamID!",
      researchObjectID: "CeramicStreamID!",
      researchObjectVersion: "CeramicCommitID!",
    },
    "createResearchFieldRelation",
  );

export const mutationCreateResearchField = async (
  composeClient: ComposeClient,
  inputs: ResearchField,
): Promise<NodeIDs> =>
  genericCreate(
    composeClient,
    inputs,
    {
      title: "String!",
    },
    "createResearchField",
  );

export const queryResearchObject = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ResearchObjectQueryResult>(
    composeClient,
    id,
    "ResearchObject",
    selection ??
      `
  title
  manifest
  metadata
  `,
  );

export const queryProfile = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ProfileQueryResult>(
    composeClient,
    id,
    "Profile",
    selection ??
      `
  displayName
  orcid
  `,
  );

export const queryClaim = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ClaimQueryResult>(
    composeClient,
    id,
    "Claim",
    selection ??
      `
  title
  description
  badge
  `,
  );

export const queryAttestation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<AttestationQueryResult>(
    composeClient,
    id,
    "Attestation",
    selection ??
      `
  targetID
  targetVersion
  claimID
  claimVersion
  revoked
  `,
  );

export const queryResearchComponent = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ResearchComponentQueryResult>(
    composeClient,
    id,
    "ResearchComponent",
    selection ??
      `
  name
  mimeType
  metadata
  dagNode
  pathToNode
  researchObjectID
  researchObjectVersion
  `,
  );

export const queryAnnotation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<AnnotationQueryResult>(
    composeClient,
    id,
    "Annotation",
    selection ??
      `
  comment
  researchObjectID
  researchObjectVersion
  targetID
  targetVersion
  dagNode
  pathToNode
  locationOnFile
  claimID
  claimVersion
  metadataPayload
  `,
  );

export const queryContributorRelation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ContributorQueryResult>(
    composeClient,
    id,
    "ContributorRelation",
    selection ??
      `
  role
  contributorID
  researchObjectID
  researchObjectVersion
  revoked
  `,
  );

export const queryReferenceRelation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ReferenceQueryResult>(
    composeClient,
    id,
    "ReferenceRelation",
    selection ??
      `
  fromID
  fromVersion
  toID
  toVersion
  revoked
  `,
  );

export const queryResearchFields = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ResearchFieldQueryResult>(
    composeClient,
    id,
    "ResearchField",
    selection ?? "title",
  );

export const queryResearchFieldRelation = async (
  composeClient: ComposeClient,
  id: string,
  selection?: string,
) =>
  genericEntityQuery<ResearchFieldRelationQueryResult>(
    composeClient,
    id,
    "ResearchFieldRelation",
    selection ??
      `
  fieldID
  researchObjectID
  researchObjectVersion
  `,
  );

export async function genericEntityQuery<
  T extends ProtocolEntity & DefaultViews,
>(
  composeClient: ComposeClient,
  id: string,
  entityName: string,
  // Specify the field structure to query for
  selection: string,
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
  const result = await composeClient.executeQuery(query, { id });
  assertQueryErrors(result, `${entityName} node`);
  return result.data ? (result.data.node as T) : undefined; // query can return null too, downscope type
}

async function genericCreate<T extends ProtocolEntity>(
  composeClient: ComposeClient,
  inputs: T,
  /** At least verify all keys exist in T, can still forget one though.
   * Can't spec it fully because some props are not allowed in the mutation.
   */
  gqlTypes: Partial<Record<keyof T, string>>,
  mutationName: string,
  /** Skip timeout for accountRelation SINGLE entities */
  noTimeout?: boolean,
): Promise<NodeIDs> {
  const [params, content] = getQueryFields(
    gqlTypes as Record<string, string>,
    inputs,
  );
  const response = (await composeClient.executeQuery(
    `
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
    }`,
    inputs,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  )) as any;
  assertMutationErrors(response, mutationName);
  const nodeIDs: NodeIDs = {
    streamID: response.data[mutationName].document.id,
    commitID: response.data[mutationName].document.version,
  };
  return nodeIDs;
}

async function genericUpdate<T extends ProtocolEntity>(
  composeClient: ComposeClient,
  inputs: PartialWithID<T>,
  // See note in genericCreate
  gqlTypes: Partial<Record<keyof T, string>>,
  mutationName: string,
): Promise<NodeIDs> {
  const [params, content] = getQueryFields(
    gqlTypes as Record<string, string>,
    inputs,
  );
  const response = (await composeClient.executeQuery(
    `
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
    }`,
    inputs,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  )) as any;
  assertMutationErrors(response, mutationName);
  const nodeIDs: NodeIDs = {
    streamID: response.data[mutationName].document.id,
    commitID: response.data[mutationName].document.version,
  };
  return nodeIDs;
}

type SimpleExecutionResult = Pick<ExecutionResult, "errors" | "data">;

const assertMutationErrors = (
  result: SimpleExecutionResult,
  queryDescription: string,
) => {
  if (result.errors) {
    console.error("Error:", result.errors.toString());
    throw new Error(`Mutation failed: ${queryDescription}`);
  }
};

const assertQueryErrors = (
  result: SimpleExecutionResult,
  queryDescription: string,
) => {
  if (result.errors || !result.data) {
    console.error("Error:", result.errors?.toString());
    throw new Error(`Query failed: ${queryDescription}!`);
  }
};

/* Get query parameters and doc content string depending on which
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
  inputs: Record<string, unknown>,
) =>
  Object.keys(inputs)
    .filter((p) => p !== "id")
    .reduce<[string[], string[]]>(
      (acc, next) => [
        [...acc[0], `$${next}: ${graphQLParamTypes[next]}`],
        [...acc[1], `${next}: $${next}`],
      ],
      [[], []],
    )
    .map((stringArr) => stringArr.join(", "));

const makeAllOptional = (typeMap: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(typeMap).map(([k, v]) => [k, v.replace("!", "")]),
  );
