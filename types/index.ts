export type Profile = {
  id?: any
  displayName?: string
  orcid?: string
}

export type ROProps = {
  id?: string
  profile?: Profile
  title: string
  manifest: string
}

export type SidebarProps = {
  displayName?: string
  id?: string
}
