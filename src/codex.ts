import { ComposeClient } from "@composedb/client";
import {
  mutationCreateAnnotation,
  mutationCreateAttestation,
  mutationCreateClaim,
  mutationCreateProfile,
  mutationCreateResearchComponent,
  mutationCreateResearchObject,
  mutationUpdateAnnotation,
  mutationUpdateAttestation,
  mutationUpdateResearchComponent,
  mutationUpdateResearchObject,
} from "./queries.js";
import {
  Annotation,
  AnnotationUpdate,
  Attestation,
  AttestationUpdate,
  Claim,
  PartialWithID,
  Profile,
  ResearchComponent,
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
  props: PartialWithID<ResearchComponent>,
) => await mutationUpdateResearchComponent(client, props);
