import { ComposeClient } from "@composedb/client";
import {
  mutationCreateAnnotation,
  mutationCreateAttestation,
  mutationCreateClaim,
  mutationCreateContributorRelation,
  mutationCreateProfile,
  mutationCreateReferenceRelation,
  mutationCreateResearchComponent,
  mutationCreateResearchFieldRelation,
  mutationCreateResearchObject,
  mutationUpdateAnnotation,
  mutationUpdateAttestation,
  mutationUpdateContributorRelation,
  mutationUpdateReferenceRelation,
  mutationUpdateResearchComponent,
  mutationUpdateResearchObject,
} from "./queries.js";
import {
  Annotation,
  AnnotationUpdate,
  Attestation,
  AttestationUpdate,
  Claim,
  ContributorRelation,
  ContributorUpdate,
  PartialWithID,
  Profile,
  ReferenceRelation,
  ReferenceUpdate,
  ResearchComponent,
  ResearchComponentUpdate,
  ResearchFieldRelation,
  ResearchObject,
} from "./types.js";

/**
 * Construct a new research object.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createResearchObject = async (
  client: ComposeClient,
  props: ResearchObject,
) => await mutationCreateResearchObject(client, props);

/**
 * Update fields on an existing research object.
 *
 * @param client - ComposeDB client instance.
 * @param props - Update delta.
 * @returns StreamID and CommitID for the update.
 */
export const updateResearchObject = async (
  client: ComposeClient,
  props: PartialWithID<ResearchObject>,
) => await mutationUpdateResearchObject(client, props);

/**
 * Create an annotation.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createAnnotation = async (
  client: ComposeClient,
  props: Annotation,
) => await mutationCreateAnnotation(client, props);

/**
 * Update fields on an existing annotation.
 *
 * @param client - ComposeDB client instance.
 * @param props - Update delta.
 * @returns StreamID and CommitID for the update.
 */
export const updateAnnotation = async (
  client: ComposeClient,
  props: PartialWithID<AnnotationUpdate>,
) => await mutationUpdateAnnotation(client, props);

/**
 * Create a new claim.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createClaim = async (client: ComposeClient, props: Claim) =>
  await mutationCreateClaim(client, props);

/**
 * Create a new attestation.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createAttestation = async (
  client: ComposeClient,
  props: Attestation,
) => await mutationCreateAttestation(client, props);

/**
 * Update fields on an existing attestation.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the update.
 */
export const updateAttestation = async (
  client: ComposeClient,
  props: PartialWithID<AttestationUpdate>,
) => await mutationUpdateAttestation(client, props);

/**
 * Create a new profile.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createProfile = async (client: ComposeClient, props: Profile) =>
  await mutationCreateProfile(client, props);

/**
 * Update fields on an existing profile.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the update.
 */
export const updateProfile = async (
  client: ComposeClient,
  props: PartialWithID<Profile>,
) => await mutationCreateProfile(client, props);

/**
 * Create a new research component.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createResearchComponent = async (
  client: ComposeClient,
  props: ResearchComponent,
) => await mutationCreateResearchComponent(client, props);

/**
 * Update fields on an existing research component.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the update.
 */
export const updateResearchComponent = async (
  client: ComposeClient,
  props: PartialWithID<ResearchComponentUpdate>,
) => await mutationUpdateResearchComponent(client, props);

/**
 * Create a new relation to a research field.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createResearchFieldRelation = async (
  client: ComposeClient,
  props: ResearchFieldRelation,
) => await mutationCreateResearchFieldRelation(client, props);

/**
 * Create a new contributor relation between a research object and a profile.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createContributorRelation = async (
  client: ComposeClient,
  props: ContributorRelation,
) => await mutationCreateContributorRelation(client, props);

/**
 * Update fields on an existing contributor relation.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the update.
 */
export const updateContributorRelation = async (
  client: ComposeClient,
  props: PartialWithID<ContributorUpdate>,
) => await mutationUpdateContributorRelation(client, props);

/**
 * Create a directed reference relation between two research objects.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the node.
 */
export const createReferenceRelation = async (
  client: ComposeClient,
  props: ReferenceRelation,
) => await mutationCreateReferenceRelation(client, props);

/**
 * Update an existing reference relation.
 *
 * @param client - ComposeDB client instance.
 * @param props - Model field contents.
 * @returns StreamID and CommitID for the update.
 */
export const updateReferenceRelation = async (
  client: ComposeClient,
  props: PartialWithID<ReferenceUpdate>,
) => await mutationUpdateReferenceRelation(client, props);
