/**
 * This module defines types for the protocol entities, as well as some
 * helpers. For each entity, there is in general three categories of types.
 *
 * Firstly, the fields required to create an instance of the entity. Optionals
 * here indicate an optional field in the model.
 *
 * Secondly, an `*Update` type. This has all fields optional, because it
 * is used when doing a mutation on an existing entity. Additionally, it omits
 * stream reference fields as they are not valid to update according to the
 * protocol spec.
 *
 * Thirdly, an `*Views` type. This contains the additional fields available
 * when querying. This is a superset of the entity type, as it also holds
 * a few extra categories of data:
 * 1. Ceramic metadata (`id`, `version`, `owner`)
 * 2. Outgoing edges (the typed summon of a `StreamID` reference)
 * 3. Incoming edges (indexed with `@relationFrom`)
 *
 * Lastly, a `*QueryResult` type which is the intersection of all of the
 * above categories, with everything optional. This is what one can select
 * from when querying for an entity.
 *
 * @packageDocumentation
 */

/***/
export type Profile = {
  displayName?: string;
  publicKey?: string;
};

export type ProfileViews = {
  contributions?: ContributorQueryResult[];
  contributionCount?: number;

  recievedAttestations?: AttestationQueryResult[];
  recievedAttestationCount?: number;
};

export type ProfileQueryResult = Partial<Profile> & ProfileViews & DefaultViews;

export type SocialHandle = {
  platform: string;
  handle: string;
};

export type SocialHandleQueryResult = Partial<SocialHandle> & DefaultViews;

/**
 * This is what's returned by graphQL when a DID/CeramicAccount is included
 */
export type DID = {
  profile?: Profile;
};

export type ResearchObject = {
  title: string;
  manifest: string;
  metadata?: string; // CID
};

export type ResearchObjectViews = {
  annotations?: AnnotationQueryResult[];
  annotationCount?: number;

  attestations?: AttestationQueryResult[];
  attestationCount?: number;

  components?: ResearchComponentQueryResult[];
  componentCount?: number;

  incomingReferences?: ReferenceQueryResult[];
  incomingReferenceCount?: number;

  outgoingReferences?: ReferenceQueryResult[];
  outgoingReferenceCount?: number;

  contributors?: ContributorQueryResult[];
  contributorCount?: number;

  researchFields?: ResearchFieldRelationQueryResult[];
};

export type ResearchObjectQueryResult = Partial<ResearchObject> &
  ResearchObjectViews &
  DefaultViews;

export type ResearchComponent = {
  name: string;
  mimeType: string;

  dagNode: string;
  pathToNode: string;

  researchObjectID: string;
  researchObjectVersion: string;

  metadata?: string; // CID
};

export type ResearchComponentStatic = "researchObjectID";
export type ResearchComponentUpdate = Omit<
  ResearchComponent,
  ResearchComponentStatic
>;

export type ResearchComponentViews = {
  annotations?: AnnotationQueryResult[];
  annotationCount?: number;

  researchObject?: ResearchObject;
};
export type ResearchComponentQueryResult = Partial<ResearchComponent> &
  ResearchComponentViews &
  DefaultViews;

export type Claim = {
  title: string;
  description: string;
  badge?: string;
};

export type ClaimViews = {
  attestations?: AttestationQueryResult[];
  attestationCount?: number;

  annotations?: AnnotationQueryResult[];
  annotationCount?: number;
};

export type ClaimQueryResult = Partial<Claim> & ClaimViews & DefaultViews;

export type Attestation = {
  targetID: string;
  targetVersion: string;

  claimID: string;
  claimVersion: string;

  revoked: boolean;
};

export type AttestationStatic = "targetID" | "claimID";
export type AttestationUpdate = Omit<Attestation, AttestationStatic | "claim">;

export type AttestationViews = {
  claim?: ClaimQueryResult;
};

export type AttestationQueryResult = Partial<Attestation> &
  AttestationViews &
  DefaultViews;

/**
 * The full range of model fields on the Annotation, unexported
 * because not all combinations make sense. See subtypes below.
 */
export type AnnotationFull = {
  comment?: string;

  researchObjectID: string;
  researchObjectVersion: string;

  targetID?: string;
  targetVersion?: string;

  dagNode?: string; // CID
  pathToNode?: string;

  locationOnFile?: string;

  claimID?: string;
  claimVersion?: string;

  metadataPayload?: string;
};

/** Annotation directly on the research object, not localized */
export type AnnotationRoot = Omit<
  AnnotationFull,
  "targetID" | "targetVersion" | "dagNode" | "pathToNode" | "locationOnFile"
>;

/** Annotation on a research object, localized to a component */
export type AnnotationComponent = Omit<
  AnnotationFull,
  "dagNode" | "pathToNode" | "locationOnFile"
>;

/** Annotation on a research object, localized to a raw DAG node */
export type AnnotationDagNode = Omit<
  AnnotationFull,
  "targetID" | "targetVersion"
>;

/** Annotation on a research object, as a reply to another annotation */
export type AnnotationReply = Omit<
  AnnotationFull,
  "dagNode" | "pathToNode" | "locationOnFile"
>;

/** Valid variations of an annotation */
export type Annotation =
  | AnnotationRoot
  | AnnotationComponent
  | AnnotationDagNode
  | AnnotationReply;

export type AnnotationStatic = "researchObjectID" | "claimID" | "targetID";
export type AnnotationUpdate = DistributiveOmit<Annotation, AnnotationStatic>;

export type AnnotationViews = {
  replies?: AnnotationQueryResult[];
  replyCount?: number;
  researchObject?: ResearchObjectQueryResult;
  claim?: ClaimQueryResult;
};

export type AnnotationQueryResult = Partial<Annotation> &
  AnnotationViews &
  DefaultViews;

export type ContributorRelation = {
  role: string;

  contributorID: string;

  researchObjectID: string;
  researchObjectVersion: string;

  revoked: boolean;
};

export type ContributorStatic = "researchObjectID" | "contributorID";
export type ContributorUpdate = Omit<ContributorRelation, ContributorStatic>;

export type ContributorViews = {
  contributor?: Profile;
  researchObject?: ResearchObjectQueryResult;
};

export type ContributorQueryResult = Partial<ContributorRelation> &
  ContributorViews &
  DefaultViews;

export type ReferenceRelation = {
  toID: string;
  toVersion: string;

  fromID: string;
  fromVersion: string;

  revoked: boolean;
};

export type ReferenceStatic = "toID" | "fromID";
export type ReferenceUpdate = Omit<ReferenceRelation, ReferenceStatic>;

export type ReferenceViews = {
  to?: ResearchObjectQueryResult;
  from?: ResearchObjectQueryResult;
};

export type ReferenceQueryResult = Partial<ReferenceRelation> &
  ReferenceViews &
  DefaultViews;

export type ResearchField = {
  title: string;
};

export type ResearchFieldViews = {
  researchObjects?: ResearchObject[];
  researchObjectCount?: number;
};
export type ResearchFieldQueryResult = Partial<ResearchField> &
  ResearchFieldViews &
  DefaultViews;

export type ResearchFieldRelation = {
  fieldID: string;

  researchObjectID: string;
  researchObjectVersion: string;
};
export type ResearchFieldRelationViews = {
  field?: ResearchField;
  researchObject?: ResearchObject;
};
export type ResearchFieldRelationQueryResult = Partial<ResearchFieldRelation> &
  ResearchFieldRelationViews &
  DefaultViews;

export type ProtocolEntity =
  | Profile
  | SocialHandle
  | ResearchObject
  | ResearchComponent
  | Claim
  | Attestation
  | Annotation
  | ContributorRelation
  | ReferenceRelation
  | ResearchField
  | ResearchFieldRelation;

export type NodeIDs = {
  streamID: string;
  commitID: string;
};

// More or less arcane utility types //

/**
 * Special fields that aren't part of the models, but available in composeDB as views.
 * These cannot be set at creation, but are available when querying.
 */
export type DefaultViews = {
  id?: string;
  version?: string;
  owner?: string;
};

/**
 * Make type partial, and require the `id` property.
 */
export type PartialWithID<T> = Partial<T> & {
  id: string;
};

/**
 * Get all keys of a union type, conditional to get union distribution.
 */
export type UnionKeys<T> = T extends unknown ? keyof T : never;

/**
 * Omit from all subtypes in a union, like mapping `Omit` over all members.
 * `T extends unknown` may look pointless, conditional types are distributive
 * which is what makes it possible.
 */
export type DistributiveOmit<T, K extends UnionKeys<T>> = T extends unknown
  ? Omit<T, Extract<keyof T, K>>
  : never;
