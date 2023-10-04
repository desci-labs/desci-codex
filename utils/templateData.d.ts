export type Seed = string;
// Address properties and array indices for indicating the future StreamID,
// will be resolved to the actual stream when the template is instantiated
export type ObjectPath = (string | number)[]

export type ProfileTemplate = {
  displayName: string,
  orcid?: string
}

export type ComponentTemplate = {
  name: string,
  dagNode: string,
  type: string
};

export type ResearchObjectTemplate = {
  title: string,
  manifest: string,
  components: ComponentTemplate[]
};

export type ClaimTemplate = {
  title: string,
  description: string
}

export type ResearchFieldTemplate = {
  title: string
};

export type ContributorRelationTemplate = {
  role: string,
  researchObjectPath: ObjectPath,
  contributorPath: ObjectPath
};

export type ReferenceRelationTemplate = {
  fromPath: ObjectPath,
  toPath: ObjectPath
};

export type ResearchFieldRelationTemplate = {
  researchObjectPath: ObjectPath,
  fieldPath: ObjectPath
};

export type AttestationTemplate = {
  targetPath: ObjectPath,
  claimPath: ObjectPath
};

export type ActorTemplate = {
  profile: ProfileTemplate,
  researchObjects: ResearchObjectTemplate[],
  claims: ClaimTemplate[],
  researchFields: ResearchFieldTemplate[],
  contributorRelations: ContributorRelationTemplate[],
  referenceRelations: ReferenceRelationTemplate[],
  researchFieldRelations: ResearchFieldRelationTemplate[],
  attestations: AttestationTemplate[]
};

export type DataTemplate = Record<Seed, ActorTemplate>
