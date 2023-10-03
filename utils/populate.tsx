import KeyDIDResolver from "key-did-resolver"
import { Ed25519Provider } from "key-did-provider-ed25519"
import { DID } from "dids"
import { fromString } from "uint8arrays/from-string"
import untypedTemplateData from "../template_data.json"
import { ComposeClient } from "@composedb/client"
import { 
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
import { Attestation, ROProps, ResearchComponent } from "@/types"
import { 
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

// Same shape as the template data, but with streamIDs for each leaf node
type ActorDataStreamIDs = {
  profile?: string
  researchObjects: {
    id: string,
    components: string[]
  }[],
  claims: string[],
  researchFields: string[],
  attestations: string[],
  contributorRelations: string[],
  referenceRelations: string[],
  researchFieldRelations: string[]
}

const freshActorRecord = (profile: string): ActorDataStreamIDs => (
  {
    profile,
    researchObjects: [],
    claims: [],
    attestations: [],
    researchFields: [],
    contributorRelations: [],
    referenceRelations: [],
    researchFieldRelations: []
  }
)

type StreamIndex = Record<string, ActorDataStreamIDs>

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

    const profileID = await mutationCreateProfile(composeClient, template.profile);
    streamIndex[seed] = freshActorRecord(profileID);

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
        attTemplate, 
        streamIndex,
        composeClient
      ))
    );
  }
  console.log("Loading template data done!")
}

const loadResearchObject = async (
  roTemplate: ResearchObjectTemplate,
  composeClient: ComposeClient
): Promise<ActorDataStreamIDs['researchObjects'][number]> => {
  const roProps: ROProps = { 
    title: roTemplate.title,
    manifest: roTemplate.manifest
  }
  const researchObject = await mutationCreateResearchObject(composeClient, roProps)

  // Possibly create manifest components if such exist
  const components = await Promise.all(
    roTemplate.components.map((c: any) => 
      mutationCreateResearchComponent(
        composeClient, 
        { 
          ...c,
          researchObjectID: researchObject
        } as ResearchComponent
      )
    )
  );

  return { id: researchObject, components }
}

const loadContributorRelation = async (
  contTemplate: ContributorRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<string> => {
  const { role, researchObjectPath, contributorPath } = contTemplate;
  const researchObjectID = recursePathToID(streamIndex, researchObjectPath);
  const contributorID = recursePathToID(streamIndex, contributorPath);
  return await mutationCreateContributorRelation(
    composeClient, 
    {
        role,
        contributorID,
        researchObjectID
    }
  );
}

const loadReferenceRelation = async (
  refTemplate: ReferenceRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<string> => {
  const { toPath, fromPath } = refTemplate;
  const toID = recursePathToID(streamIndex, toPath);
  const fromID = recursePathToID(streamIndex, fromPath);
  return await mutationCreateReferenceRelation(
    composeClient, 
    {
      toID,
      fromID
    }
  );
}

const loadResearchFieldRelation = async (
  fieldRelTemplate: ResearchFieldRelationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<string> => {
  const { researchObjectPath, fieldPath } = fieldRelTemplate;
  const researchObjectID = recursePathToID(streamIndex, researchObjectPath);
  const fieldID = recursePathToID(streamIndex, fieldPath);
  return await mutationCreateResearchFieldRelation(
    composeClient, 
    {
      researchObjectID,
      fieldID
    }
  );
}

const loadAttestation = async (
  attestationTemplate: AttestationTemplate,
  streamIndex: StreamIndex,
  composeClient: ComposeClient
): Promise<ActorDataStreamIDs['attestations'][number]> => {
  const { targetPath, claimPath } = attestationTemplate;
  const targetID = recursePathToID(streamIndex, targetPath);
  const claimID = recursePathToID(streamIndex, claimPath);
  const attestation: Attestation = { targetID, claimID, revoked: false };
  return mutationCreateAttestation(composeClient, attestation);
}

// Oblivious to human faults, enjoy the footgun
const recursePathToID = (object: any, path: ObjectPath): string =>
  path.length ? recursePathToID(object[path[0]], path.slice(1)) : object
