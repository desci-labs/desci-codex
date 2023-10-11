export type Profile = {
  id?: string
  version?: string
  displayName?: string
  orcid?: string
};

export type DID = {
  profile?: Profile
};

export type ROProps = {
  id?: string
  version?: string
  title: string
  manifest: string
  components?: ResearchComponent[]
  metadata?: string
  owner?: DID
};

export type ResearchComponent = {
  owner?: DID
  version?: string
  name: string
  mimeType: string
  dagNode: string
  researchObjectID: string
  researchObjectVersion: string
};

export type Claim = {
  id?: string
  version?: string
  title: string
  description: string
  badge?: string
};

export type Attestation = {
  id?: string
  version?: string
  source?: DID
  targetID: string
  targetVersion: string
  claimID: string
  claimVersion: string
  claim?: Claim 
  revoked: boolean
};

export type Annotation = {
  id?: string
  version?: string
  comment: string
  path?: string
  targetID: string
  targetVersion: string
  claimID?: string
  claim?: Claim
  claimVersion?: string
  metadataPayload?: string
};

export type ContributorRelation = {
  id?: string
  role: string
  // info
  contributorID: string
  researchObjectID: string
  researchObjectVersion: string
};

export type ReferenceRelation = {
  id?: string
  toID: string
  toVersion: string
  fromID: string
  fromVersion: string
};

export type ResearchField = {
  title: string
};

export type ResearchFieldRelation = {
  id?: string
  fieldID: string
  researchObjectID: string
  researchObjectVersion: string
};

export type MutationTarget = 
  Profile |
  ROProps |
  ResearchComponent |
  Claim |
  Attestation |
  Annotation |
  ContributorRelation |
  ReferenceRelation |
  ResearchField |
  ResearchFieldRelation;

export type NodeIDs = {
  streamID: string,
  version: string
};

export type SidebarProps = {
  displayName?: string
  id?: string
};

export type RequiredKeys<T> = {
  [K in keyof T as (undefined extends T[K] ? never : K)]: T[K]
};
