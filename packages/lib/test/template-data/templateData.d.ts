import { Profile, ResearchComponent } from "../../src/types.js";

export type Seed = string;
// Address properties and array indices for indicating the future StreamID,
// will be resolved to the actual stream when the template is instantiated
export type ObjectPath = (string | number)[];

export type ProfileTemplate = Profile;

export type ResearchComponentTemplate = Omit<
  ResearchComponent,
  "owner" | "version" | "researchObjectID" | "researchObjectVersion"
> & { researchObjectPath: ObjectPath };

export type ResearchObjectTemplate = {
  title: string;
  manifest: string;
  metadata?: string;
};

export type ClaimTemplate = {
  title: string;
  description: string;
};

export type ResearchFieldTemplate = {
  title: string;
};

export type ContributorRelationTemplate = {
  role: string;
  researchObjectPath: ObjectPath;
  contributorPath: ObjectPath;
};

export type ReferenceRelationTemplate = {
  fromPath: ObjectPath;
  toPath: ObjectPath;
};

export type ResearchFieldRelationTemplate = {
  researchObjectPath: ObjectPath;
  fieldPath: ObjectPath;
};

export type AttestationTemplate = {
  targetPath: ObjectPath;
  claimPath: ObjectPath;
};

export type AnnotationTemplate = {
  comment: string;
  researchObjectPath: ObjectPath;
  targetPath?: ObjectPath;
  dagNode?: string;
  pathToNode?: string;
  locationOnFile?: string;
  claimPath?: ObjectPath;
  metadataPayload?: string;
};

export type ActorTemplate = {
  profile: ProfileTemplate;
  researchObjects: ResearchObjectTemplate[];
  researchComponents: ResearchComponentTemplate[];
  claims: ClaimTemplate[];
  researchFields: ResearchFieldTemplate[];
  contributorRelations: ContributorRelationTemplate[];
  referenceRelations: ReferenceRelationTemplate[];
  researchFieldRelations: ResearchFieldRelationTemplate[];
  attestations: AttestationTemplate[];
  annotations: AnnotationTemplate[];
};

export type DataTemplate = Record<Seed, ActorTemplate>;
