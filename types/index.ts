export type Profile = {
  id?: string
  displayName?: string
  orcid?: string
};

export type DID = {
  profile?: Profile
};

export type ROProps = {
  id?: string
  title: string
  manifest: string
  components?: ResearchComponent[]
  owner?: DID
};

export type ResearchComponent = {
  owner?: DID
  name: string
  mimeType: string
  dagNode: string
  researchObjectID: string
};

export type Claim = {
  id?: string
  title: string
  description: string
  badge?: string
};

export type Attestation = {
  id?: string
  source?: DID
  targetID: string
  claimID: string
  claim?: Claim 
  revoked: boolean
};

export type Annotation = {
  id?: string
  comment: string
  path: string
  componentID: string
  component?: ResearchComponent
  claimID: string
  claim?: Claim
};

export type ContributorRelation = {
  id?: string
  role: string
  // info
  contributorID: string
  researchObjectID: string
};

export type ReferenceRelation = {
  id?: string
  toID: string
  fromID: string
};

export type ResearchFieldRelation = {
  id?: string
  fieldID: string
  researchObjectID: string
};

export type SidebarProps = {
  displayName?: string
  id?: string
};

export type RequiredKeys<T> = {
  [K in keyof T as (undefined extends T[K] ? never : K)]: T[K]
};
