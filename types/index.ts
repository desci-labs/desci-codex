export type Profile = {
  id?: string
  displayName?: string
  orcid?: string
}

export type DID = {
  profile?: Profile
}

export type ROProps = {
  id?: string
  title: string
  manifest: string
  components?: ResearchComponent[]
  owner?: DID
}

export type ResearchComponent = {
  owner?: DID
  name: string
  type: ComponentType
  dagNode: string
  researchObjectID: string
}

export type ComponentType =
  "DATA_BUCKET" |
  "UNKNOWN"

export type Claim = {
  id?: string,
  title: string,
  description: string,
  badge?: string
}

export type Attestation = {
  id?: string,
  source?: DID,
  targetID: string,
  claimID: string,
  claim?: Claim ,
  revoked: boolean
}

export type SidebarProps = {
  displayName?: string
  id?: string
}
