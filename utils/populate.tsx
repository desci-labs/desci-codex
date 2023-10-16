import KeyDIDResolver from "key-did-resolver"
import { Ed25519Provider } from "key-did-provider-ed25519"
import { DID } from "dids"
import { fromString } from "uint8arrays/from-string"
import untypedTemplateData from "../template_data.json"
import { ComposeClient } from "@composedb/client"
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
  mutationCreateResearchObject
} from "./queries"
import { CeramicClient } from "@ceramicnetwork/http-client"
import { definition } from '@/src/__generated__/definition'
import { RuntimeCompositeDefinition } from "@composedb/types"
import { Annotation, Attestation, NodeIDs, ResearchObject } from "@/types"
import {
  AnnotationTemplate,
  AttestationTemplate,
  ContributorRelationTemplate,
  DataTemplate,
  ObjectPath,
  ReferenceRelationTemplate,
  ResearchFieldRelationTemplate,
  ResearchObjectTemplate
} from "./templateData"

const templateData: DataTemplate = untypedTemplateData;

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
  return did;
};

type ProfileIndexResults = { data: { profileIndex: { edges: [] } } }
export const loadIfUninitialised = async (ceramic: CeramicClient) => {
  const composeClient = new ComposeClient(
    {
      ceramic,
      definition: definition as RuntimeCompositeDefinition
    }
  );
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
  `) as ProfileIndexResults;

  if (firstProfile.data.profileIndex.edges.length === 0) {
    console.log("Profile index empty, loading template data...")
    await loadTemplateData(composeClient)
  } else {
    console.log("Found profiles in index, skipping template data initialisation.")
  };
};

// Same shape as the template data, but with NodeIDs for each leaf
type ActorDataNodeIDs = {
  profile?: NodeIDs
  researchObjects: {
    IDs: NodeIDs
    components: NodeIDs[]
  }[],
  claims: NodeIDs[],
  researchFields: NodeIDs[],
  attestations: NodeIDs[],
  contributorRelations: NodeIDs[],
  referenceRelations: NodeIDs[],
  researchFieldRelations: NodeIDs[],
  annotations: NodeIDs[]
};

const freshActorRecord = (profile: NodeIDs): ActorDataNodeIDs => (
  {
    profile,
    researchObjects: [],
    claims: [],
    attestations: [],
    researchFields: [],
    contributorRelations: [],
    referenceRelations: [],
    researchFieldRelations: [],
    annotations: []
  }
);

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
    composeClient.setDID(await didFromSeed(seed))

    const profileIDs = await mutationCreateProfile(composeClient, template.profile);
    streamIndex[seed] = freshActorRecord(profileIDs);

    streamIndex[seed].researchFields = await Promise.all(
      template.researchFields.map(
        rfTemplate => mutationCreateResearchField(composeClient, rfTemplate)
      )
    );

    streamIndex[seed].researchObjects = await Promise.all(
      template.researchObjects.map(
        roTemplate => loadResearchObject(roTemplate, composeClient)
      )
    );

    streamIndex[seed].contributorRelations = await Promise.all(
      template.contributorRelations.map((contTemplate: any) =>
        loadContributorRelation(contTemplate, streamIndex, composeClient)
      )
    );

    streamIndex[seed].referenceRelations = await Promise.all(
      template.referenceRelations.map((refTemplate: any) =>
        loadReferenceRelation(refTemplate, streamIndex, composeClient)
      )
    );

    streamIndex[seed].researchFieldRelations = await Promise.all(
      template.researchFieldRelations.map((fieldRelTemplate: any) =>
        loadResearchFieldRelation(fieldRelTemplate, streamIndex, composeClient)
      )
    );

    streamIndex[seed].claims = await Promise.all(
      template.claims.map(c => mutationCreateClaim(composeClient, c))
    );

    streamIndex[seed].attestations = await Promise.all(
      template.attestations.map(attTemplate => loadAttestation(
        attTemplate, streamIndex, composeClient
      ))
    );

    streamIndex[seed].annotations = await Promise.all(
      template.annotations.map(annTemplate => loadAnnotation(
        annTemplate, streamIndex, composeClient
      ))
    );
  };
  console.log("Loading template data done!");
}

const loadResearchObject = async (
  roTemplate: ResearchObjectTemplate,
  composeClient: ComposeClient
): Promise<ActorDataNodeIDs['researchObjects'][number]> => {
  const roProps: ResearchObject = {
    title: roTemplate.title,
    manifest: roTemplate.manifest
  }
  const researchObject = await mutationCreateResearchObject(composeClient, roProps);

  // Possibly create manifest components if such exist
  const components = await Promise.all(
    roTemplate.components.map((c: any) =>
      mutationCreateResearchComponent(
        composeClient,
        {
          ...c,
          researchObjectID: researchObject.streamID,
          researchObjectVersion: researchObject.commitID
        }
      )
    )
  );

  return { IDs: researchObject, components };
};

const loadContributorRelation = async (
  contTemplate: ContributorRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<ActorDataNodeIDs['contributorRelations'][number]> => {
  const { role, researchObjectPath, contributorPath } = contTemplate;
  const researchObject = recursePathToID(streamIndex, researchObjectPath);
  const contributor = recursePathToID(streamIndex, contributorPath);
  return await mutationCreateContributorRelation(
    composeClient,
    {
      role,
      contributorID: contributor.streamID,
      researchObjectID: researchObject.streamID,
      researchObjectVersion: researchObject.commitID
    }
  );
};

const loadReferenceRelation = async (
  refTemplate: ReferenceRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<ActorDataNodeIDs['referenceRelations'][number]> => {
  const { toPath, fromPath } = refTemplate;
  const to = recursePathToID(streamIndex, toPath);
  const from = recursePathToID(streamIndex, fromPath);
  return await mutationCreateReferenceRelation(
    composeClient,
    {
      toID: to.streamID,
      toVersion: to.commitID,
      fromID: from.streamID,
      fromVersion: from.commitID
    }
  );
};

const loadResearchFieldRelation = async (
  fieldRelTemplate: ResearchFieldRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<ActorDataNodeIDs['researchFieldRelations'][number]> => {
  const { researchObjectPath, fieldPath } = fieldRelTemplate;
  const researchObject = recursePathToID(streamIndex, researchObjectPath);
  const field = recursePathToID(streamIndex, fieldPath);
  return await mutationCreateResearchFieldRelation(
    composeClient,
    {
      researchObjectID: researchObject.streamID,
      researchObjectVersion: researchObject.commitID,
      fieldID: field.streamID
    }
  );
};

const loadAttestation = async (
  attestationTemplate: AttestationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<ActorDataNodeIDs['attestations'][number]> => {
  const { targetPath, claimPath } = attestationTemplate;
  const target = recursePathToID(streamIndex, targetPath);
  const claim = recursePathToID(streamIndex, claimPath);
  const attestation: Attestation = {
    targetID: target.streamID,
    targetVersion: target.commitID,
    claimID: claim.streamID,
    claimVersion: claim.commitID,
    revoked: false
  };
  return mutationCreateAttestation(composeClient, attestation);
};

const loadAnnotation = async (
  annotationTemplate: AnnotationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<ActorDataNodeIDs['annotations'][number]> => {
  const { comment, path, targetPath, claimPath } = annotationTemplate;
  const target = recursePathToID(streamIndex, targetPath);
  const annotation: Annotation = {
    targetID: target.streamID,
    targetVersion: target.commitID,
    comment
  };
  if (claimPath) {
    const claim = recursePathToID(streamIndex, claimPath);
    annotation.claimID = claim.streamID;
    annotation.claimVersion = claim.commitID;
  };
  if (path) {
    annotation.path = path;
  };
  return mutationCreateAnnotation(composeClient, annotation);
};

// Oblivious to human faults, enjoy the footgun
const recursePathToID = (object: any, path: ObjectPath): NodeIDs =>
  path.length ? recursePathToID(object[path[0]], path.slice(1)) : object;
