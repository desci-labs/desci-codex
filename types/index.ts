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
  owner?: DID
}

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
