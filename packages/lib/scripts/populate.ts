import { ComposeClient } from "@composedb/client";
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
} from "../src/queries.js";
import { CeramicClient } from "@ceramicnetwork/http-client";
import {
  Annotation,
  AnnotationFull,
  Attestation,
  NodeIDs,
  ResearchComponent,
  ResearchObject,
} from "../src/types.js";
import {
  AnnotationTemplate,
  AttestationTemplate,
  ContributorRelationTemplate,
  DataTemplate,
  ObjectPath,
  ReferenceRelationTemplate,
  ResearchComponentTemplate,
  ResearchFieldRelationTemplate,
  ResearchObjectTemplate,
} from "../test/template-data/templateData.js";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { definition } from "../../composedb/src/__generated__/definition.js";

import untypedTemplateData from "../test/template-data/template_data.json" assert { type: "json" };
import { didFromSeed } from "../src/clients.js";

const templateData: DataTemplate = untypedTemplateData;

type ProfileIndexResult = { profileIndex: { edges: [] } };
export const loadIfUninitialised = async (ceramic: CeramicClient) => {
  const composeClient = new ComposeClient({
    ceramic,
    definition: definition as RuntimeCompositeDefinition,
  });
  const firstProfile = await composeClient.executeQuery<ProfileIndexResult>(`
    query {
      profileIndex(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  `);

  if (firstProfile.errors) {
    console.error(
      "Failed to query Ceramic:",
      JSON.stringify(firstProfile.errors, undefined, 2),
    );
    console.error("Is the Ceramic node running?");
    process.exit(1);
  }

  if (firstProfile.data!.profileIndex.edges.length === 0) {
    console.log("Profile index empty, loading template data...");
    await loadTemplateData(composeClient);
  } else {
    console.log(
      "Found profiles in index, skipping template data initialisation.",
    );
  }
};

// Same shape as the template data, but with NodeIDs for each leaf
type ActorDataNodeIDs = {
  profile?: NodeIDs;
  researchObjects: NodeIDs[];
  researchComponents: NodeIDs[];
  claims: NodeIDs[];
  researchFields: NodeIDs[];
  attestations: NodeIDs[];
  contributorRelations: NodeIDs[];
  referenceRelations: NodeIDs[];
  researchFieldRelations: NodeIDs[];
  annotations: NodeIDs[];
};

const freshActorRecord = (profile: NodeIDs): ActorDataNodeIDs => ({
  profile,
  researchObjects: [],
  researchComponents: [],
  claims: [],
  attestations: [],
  researchFields: [],
  contributorRelations: [],
  referenceRelations: [],
  researchFieldRelations: [],
  annotations: [],
});

type StreamIndex = Record<string, ActorDataNodeIDs>;

/**
 * Iterates over template data file, and with a DID generated from each root entry
 * seed runs mutations to create instances of the data. Builds up the corresponding
 * record but with the streamIDs of the nodes so they can be found and used as targets
 * for more complex instances made by later actors.
 **/
const loadTemplateData = async (composeClient: ComposeClient) => {
  const streamIndex: StreamIndex = {};
  for (const [seed, template] of Object.entries(templateData)) {
    composeClient.setDID(await didFromSeed(seed));

    const profileIDs = await mutationCreateProfile(
      composeClient,
      template.profile,
    );
    streamIndex[seed] = freshActorRecord(profileIDs);

    streamIndex[seed].researchFields = await Promise.all(
      template.researchFields.map((rfTemplate) =>
        mutationCreateResearchField(composeClient, rfTemplate),
      ),
    );

    streamIndex[seed].researchObjects = await Promise.all(
      template.researchObjects.map((roTemplate) =>
        loadResearchObject(roTemplate, composeClient),
      ),
    );

    streamIndex[seed].researchComponents = await Promise.all(
      template.researchComponents.map((component) =>
        loadResearchComponent(component, streamIndex, composeClient),
      ),
    );

    streamIndex[seed].contributorRelations = await Promise.all(
      template.contributorRelations.map((contTemplate) =>
        loadContributorRelation(contTemplate, streamIndex, composeClient),
      ),
    );

    streamIndex[seed].referenceRelations = await Promise.all(
      template.referenceRelations.map((refTemplate) =>
        loadReferenceRelation(refTemplate, streamIndex, composeClient),
      ),
    );

    streamIndex[seed].researchFieldRelations = await Promise.all(
      template.researchFieldRelations.map((fieldRelTemplate) =>
        loadResearchFieldRelation(fieldRelTemplate, streamIndex, composeClient),
      ),
    );

    streamIndex[seed].claims = await Promise.all(
      template.claims.map((c) => mutationCreateClaim(composeClient, c)),
    );

    streamIndex[seed].attestations = await Promise.all(
      template.attestations.map((attTemplate) =>
        loadAttestation(attTemplate, streamIndex, composeClient),
      ),
    );

    streamIndex[seed].annotations = await Promise.all(
      template.annotations.map((annTemplate) =>
        loadAnnotation(annTemplate, streamIndex, composeClient),
      ),
    );
  }
  console.log("Loading template data done!");
};

const loadResearchObject = async (
  roTemplate: ResearchObjectTemplate,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["researchObjects"][number]> => {
  const roProps: ResearchObject = {
    title: roTemplate.title,
    manifest: roTemplate.manifest,
  };
  const researchObject = await mutationCreateResearchObject(
    composeClient,
    roProps,
  );

  return researchObject;
};

const loadResearchComponent = async (
  rcTemplate: ResearchComponentTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["researchComponents"][number]> => {
  const { name, mimeType, dagNode, pathToNode, researchObjectPath, metadata } =
    rcTemplate;
  const researchObject = recursePathToID(streamIndex, researchObjectPath);
  const component: ResearchComponent = {
    name,
    mimeType,
    dagNode,
    pathToNode,
    researchObjectID: researchObject.streamID,
    researchObjectVersion: researchObject.commitID,
  };

  // Handle optionals
  if (metadata) component.metadata = metadata;
  return await mutationCreateResearchComponent(composeClient, component);
};

const loadContributorRelation = async (
  contTemplate: ContributorRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["contributorRelations"][number]> => {
  const { role, researchObjectPath, contributorPath } = contTemplate;
  const researchObject = recursePathToID(streamIndex, researchObjectPath);
  const contributor = recursePathToID(streamIndex, contributorPath);
  return await mutationCreateContributorRelation(composeClient, {
    role,
    contributorID: contributor.streamID,
    researchObjectID: researchObject.streamID,
    researchObjectVersion: researchObject.commitID,
    revoked: false,
  });
};

const loadReferenceRelation = async (
  refTemplate: ReferenceRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["referenceRelations"][number]> => {
  const { toPath, fromPath } = refTemplate;
  const to = recursePathToID(streamIndex, toPath);
  const from = recursePathToID(streamIndex, fromPath);
  return await mutationCreateReferenceRelation(composeClient, {
    toID: to.streamID,
    toVersion: to.commitID,
    fromID: from.streamID,
    fromVersion: from.commitID,
    revoked: false,
  });
};

const loadResearchFieldRelation = async (
  fieldRelTemplate: ResearchFieldRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["researchFieldRelations"][number]> => {
  const { researchObjectPath, fieldPath } = fieldRelTemplate;
  const researchObject = recursePathToID(streamIndex, researchObjectPath);
  const field = recursePathToID(streamIndex, fieldPath);
  return await mutationCreateResearchFieldRelation(composeClient, {
    researchObjectID: researchObject.streamID,
    researchObjectVersion: researchObject.commitID,
    fieldID: field.streamID,
  });
};

const loadAttestation = async (
  attestationTemplate: AttestationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["attestations"][number]> => {
  const { targetPath, claimPath } = attestationTemplate;
  const target = recursePathToID(streamIndex, targetPath);
  const claim = recursePathToID(streamIndex, claimPath);
  const attestation: Attestation = {
    targetID: target.streamID,
    targetVersion: target.commitID,
    claimID: claim.streamID,
    claimVersion: claim.commitID,
    revoked: false,
  };
  return mutationCreateAttestation(composeClient, attestation);
};

const loadAnnotation = async (
  annotationTemplate: AnnotationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient,
): Promise<ActorDataNodeIDs["annotations"][number]> => {
  const {
    comment,
    researchObjectPath,
    targetPath,
    dagNode,
    pathToNode,
    locationOnFile,
    claimPath,
    metadataPayload,
  } = annotationTemplate;

  const researchObject = recursePathToID(streamIndex, researchObjectPath);
  const annotation: Partial<AnnotationFull> = {
    comment,
    researchObjectID: researchObject.streamID,
    researchObjectVersion: researchObject.commitID,
  };
  if (targetPath) {
    const target = recursePathToID(streamIndex, targetPath);
    annotation.researchObjectID = target.streamID;
    annotation.researchObjectVersion = target.commitID;
  }
  if (claimPath) {
    const claim = recursePathToID(streamIndex, claimPath);
    annotation.claimID = claim.streamID;
    annotation.claimVersion = claim.commitID;
  }

  // GraphQL queries dislike undefined
  if (dagNode) annotation.dagNode = dagNode;
  if (pathToNode) annotation.pathToNode = dagNode;
  if (locationOnFile) annotation.locationOnFile = dagNode;
  if (metadataPayload) annotation.metadataPayload = dagNode;

  return mutationCreateAnnotation(composeClient, annotation as Annotation);
};

// Oblivious to human faults, enjoy the footgun
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const recursePathToID = (object: any, path: ObjectPath): NodeIDs =>
  path.length ? recursePathToID(object[path[0]], path.slice(1)) : object;

loadIfUninitialised(new CeramicClient("http://localhost:7007"));
