import { readFileSync, writeFileSync } from "fs";
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

const ceramic = new CeramicClient(
  process.env.CERAMIC_ENDPOINT || "http://localhost:7007",
);
const ENCODED_PATH = "./src/__generated__/definition.json";
const ENCODED_RUNTIME_PATH = "./src/__generated__/definition.js";

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

  await writeEncodedComposite(composite, ENCODED_PATH);
  spinner.info("creating composite for runtime usage");
  await writeEncodedCompositeRuntime(
    ceramic,
    ENCODED_PATH,
    ENCODED_RUNTIME_PATH,
  );

  // Fix non-determinism due to arbitrarily sorted keys in files
  await orderCompositeFileKeys();

  spinner.info("deploying composite");
  const deployComposite = await readEncodedComposite(ceramic, ENCODED_PATH);

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

/**
 * Repeated runs yield diffs in generated composite definition files, even
 * if they are semantically the same, because the keys aren't serialized
 * in order. This function fixes that, making it clear in git when they
 * actually have changed.
 */
const orderCompositeFileKeys = async () => {
  /* eslint-disable @typescript-eslint/no-explicit-any*/

  /**
   * Recursively order object keys to get deterministic serialization
   * https://gist.github.com/davidfurlong/463a83a33b70a3b6618e97ec9679e490
   */
  const orderedReplacer = (_key: any, value: any) =>
    value instanceof Object && !(value instanceof Array)
      ? Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          }, {} as any)
      : value;

  const encoded = JSON.parse(readFileSync(ENCODED_PATH, { encoding: "ascii" }));
  writeFileSync(ENCODED_PATH, JSON.stringify(encoded, orderedReplacer));

  const { definition } = await import(
    process.cwd() + "/" + ENCODED_RUNTIME_PATH
  );
  const encoded_runtime_ordered = `
export const definition = ${JSON.stringify(definition, orderedReplacer)}
`;
  writeFileSync(ENCODED_RUNTIME_PATH, encoded_runtime_ordered);
};

const runAsScript =
  process.argv[0].includes("/bin/node") &&
  process.argv[1].includes("scripts/composites.ts");

if (runAsScript) {
  const seed = process.env.ADMIN_SEED;
  if (!seed) throw new Error("No ADMIN_SEED environment variable set!");
  await writeComposite(seed);
}
