export type Profile = {
  displayName?: string;
  orcid?: string;
};

export type DID = {
  profile?: Profile;
};

export type ResearchObject = {
  title: string;
  manifest: string;

  components?: ResearchComponent[];

  metadata?: string; // CID
};

export type ResearchComponent = {
  name: string;
  mimeType: string;

  dagNode: string;
  pathToNode: string;

  researchObjectID: string;
  researchObjectVersion: string;

  metadata?: string; // CID
};

export type Claim = {
  title: string;
  description: string;
  badge?: string;
};

export type Attestation = {
  targetID: string;
  targetVersion: string;

  claimID: string;
  claimVersion: string;
  claim?: Claim;

  revoked: boolean;
};

export type AttestationStatic = "targetID" | "claimID";
export type AttestationUpdate = Omit<Attestation, AttestationStatic>;

/**
 * The full range of model fields on the Annotation, unexported
 * because not all combinations make sense. See subtypes below.
 */
type AnnotationFull = {
  comment?: string;

  researchObjectID: string;
  researchObject?: ResearchObject;
  researchObjectVersion: string;

  targetID?: string;
  targetVersion?: string;

  dagNode?: string; // CID
  pathToNode?: string;

  locationOnFile?: string;

  claimID?: string;
  claim?: Claim;
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

/** Fields which do not make sense to update in any annotation */
export type AnnotationStatic = "researchObjectID" | "claimID" | "targetID";

/** Any `Annotation` instance, but excluding static fields. */
export type AnnotationUpdate = DistributiveOmit<Annotation, AnnotationStatic>;

export type ContributorRelation = {
  role: string;

  contributorID: string;

  researchObjectID: string;
  researchObjectVersion: string;

  revoked: boolean;
};

export type ReferenceRelation = {
  toID: string;
  toVersion: string;

  fromID: string;
  fromVersion: string;

  revoked: boolean;
};

export type ResearchField = {
  title: string;
};

export type ResearchFieldRelation = {
  fieldID: string;

  researchObjectID: string;
  researchObjectVersion: string;
};

export type ProtocolEntity =
  | Profile
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
export type WithDefaultViews<T extends ProtocolEntity> = T & {
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
type UnionKeys<T> = T extends unknown ? keyof T : never;

/**
 * Omit from all subtypes in a union, like mapping `Omit` over all members.
 * `T extends unknown` may look pointless, conditional types are distributive
 * which is what makes it possible.
 */
export type DistributiveOmit<T, K extends UnionKeys<T>> = T extends unknown
  ? Omit<T, Extract<keyof T, K>>
  : never;
