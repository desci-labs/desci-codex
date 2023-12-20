import { readFileSync } from "fs";
import { CeramicClient } from "@ceramicnetwork/http-client";
import {
  createComposite,
  readEncodedComposite,
  writeEncodedComposite,
  writeEncodedCompositeRuntime,
} from "@composedb/devtools-node";
import { Composite } from "@composedb/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays/from-string";
import { Ora } from "ora";

const ceramic = new CeramicClient("http://localhost:7007");

type Models = {
  profile?: string;
  socialHandle?: string;
  researchObject?: string;
  researchField?: string;
  claim?: string;
  attestation?: string;
  researchComponent?: string;
  referenceRelation?: string;
  contributorRelation?: string;
  researchFieldRelation?: string;
  annotation?: string;
};

export const writeComposite = async (seed: string, spinner?: Ora) => {
  if (!spinner) {
    spinner = { info: console.log, succeed: console.log } as Ora;
  }
  await authenticateAdmin(seed);
  spinner.info("writing composite to Ceramic");

  /** Collect streamID of each composite as it is created */
  const modelIDs: Models = {};

  const profileComposite = await createComposite(
    ceramic,
    "./composites/1-profile.graphql",
  );
  modelIDs.profile = profileComposite.modelIDs[0];

  const socialHandleComposite = await createComposite(
    ceramic,
    "./composites/1-socialHandle.graphql",
  );
  modelIDs.socialHandle = socialHandleComposite.modelIDs[0];

  const researchObjectComposite = await createComposite(
    ceramic,
    "./composites/1-researchObject.graphql",
  );
  modelIDs.researchObject = researchObjectComposite.modelIDs[0];

  const researchFieldComposite = await createComposite(
    ceramic,
    "./composites/1-researchField.graphql",
  );
  modelIDs.researchField = researchFieldComposite.modelIDs[0];

  const claimComposite = await createComposite(
    ceramic,
    "./composites/1-claim.graphql",
  );
  modelIDs.claim = claimComposite.modelIDs[0];

  const attestationSchema = readFileSync("./composites/2-attestation.graphql", {
    encoding: "utf-8",
  }).replace("$CLAIM_ID", modelIDs.claim);

  const attestationComposite = await Composite.create({
    ceramic,
    schema: attestationSchema,
  });
  modelIDs.attestation = attestationComposite.modelIDs[1];

  const researchComponentSchema = readFileSync(
    "./composites/2-researchComponent.graphql",
    { encoding: "utf-8" },
  ).replace("$RESEARCH_OBJECT_ID", modelIDs.researchObject);

  const researchComponentComposite = await Composite.create({
    ceramic,
    schema: researchComponentSchema,
  });
  modelIDs.researchComponent = researchComponentComposite.modelIDs[1];

  const referenceRelationSchema = readFileSync(
    "./composites/2-referenceRelation.graphql",
    { encoding: "utf-8" },
  ).replace("$RESEARCH_OBJECT_ID", modelIDs.researchObject);

  const referenceRelationComposite = await Composite.create({
    ceramic,
    schema: referenceRelationSchema,
  });
  modelIDs.referenceRelation = referenceRelationComposite.modelIDs[1];

  const contributorRelationSchema = readFileSync(
    "./composites/2-contributorRelation.graphql",
    { encoding: "utf-8" },
  )
    .replace("$RESEARCH_OBJECT_ID", modelIDs.researchObject)
    .replace("$PROFILE_ID", modelIDs.profile);

  const contributorRelationComposite = await Composite.create({
    ceramic,
    schema: contributorRelationSchema,
  });
  modelIDs.contributorRelation = contributorRelationComposite.modelIDs[2];

  const researchFieldRelationSchema = readFileSync(
    "./composites/2-researchFieldRelation.graphql",
    { encoding: "utf-8" },
  )
    .replace("$RESEARCH_OBJECT_ID", modelIDs.researchObject)
    .replace("$RESEARCH_FIELD_ID", modelIDs.researchField);

  const researchFieldRelationComposite = await Composite.create({
    ceramic,
    schema: researchFieldRelationSchema,
  });
  modelIDs.researchFieldRelation = researchFieldRelationComposite.modelIDs[2];

  const annotationSchema = readFileSync("./composites/2-annotation.graphql", {
    encoding: "utf-8",
  })
    .replace("$CLAIM_ID", modelIDs.claim)
    .replace("$RESEARCH_OBJECT_ID", modelIDs.researchObject);

  const annotationComposite = await Composite.create({
    ceramic,
    schema: annotationSchema,
  });
  modelIDs.annotation = annotationComposite.modelIDs[2];

  const additionalRelationsSchema = readFileSync(
    "./composites/3-additionalRelations.graphql",
    { encoding: "utf-8" },
  )
    .replace("$ATTESTATION_ID", modelIDs.attestation)
    .replace("$CLAIM_ID", modelIDs.claim)
    .replace("$RESEARCH_OBJECT_ID", modelIDs.researchObject)
    .replace("$PROFILE_ID", modelIDs.profile)
    .replace("$RESEARCH_COMPONENT_ID", modelIDs.researchComponent)
    .replace("$CONTRIBUTOR_RELATION_ID", modelIDs.contributorRelation)
    .replace("$REFERENCE_RELATION_ID", modelIDs.referenceRelation)
    .replace("$RESEARCH_FIELD_ID", modelIDs.researchField)
    .replace("$RESEARCH_FIELD_RELATION_ID", modelIDs.researchFieldRelation)
    .replace("$ANNOTATION_ID", modelIDs.annotation);

  const additionalRelationsComposite = await Composite.create({
    ceramic,
    schema: additionalRelationsSchema,
  });

  const composite = Composite.from([
    profileComposite,
    socialHandleComposite,
    researchObjectComposite,
    claimComposite,
    attestationComposite,
    researchComponentComposite,
    additionalRelationsComposite,
    contributorRelationComposite,
    referenceRelationComposite,
    researchFieldComposite,
    researchFieldRelationComposite,
    annotationComposite,
  ]);

  await writeEncodedComposite(composite, "./src/__generated__/definition.json");
  spinner.info("creating composite for runtime usage");
  await writeEncodedCompositeRuntime(
    ceramic,
    "./src/__generated__/definition.json",
    "./src/__generated__/definition.js",
  );
  spinner.info("deploying composite");
  const deployComposite = await readEncodedComposite(
    ceramic,
    "./src/__generated__/definition.json",
  );

  await deployComposite.startIndexingOn(ceramic);
  spinner.succeed("composite deployed & ready for use");
};

/**
 * Authenticating DID for publishing composite
 */
const authenticateAdmin = async (seed: string): Promise<void> => {
  const key = fromString(seed, "base16");
  const did = new DID({
    resolver: getResolver(),
    provider: new Ed25519Provider(key),
  });
  await did.authenticate();
  await ceramic.setDID(did);
};

const runAsScript =
  process.argv[0].includes("/bin/node") &&
  process.argv[1].includes("scripts/composites.ts");

if (runAsScript) {
  const seed = process.env.ADMIN_SEED;
  if (!seed) throw new Error("No ADMIN_SEED environment variable set!");
  await writeComposite(seed);
}
