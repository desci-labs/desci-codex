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

const ceramic = new CeramicClient("http://localhost:7007");

/**
 * @param {Ora} spinner - to provide progress status.
 * @return {Promise<void>} - return void when composite finishes deploying.
 */
export const writeComposite = async (spinner) => {
  await authenticate();
  spinner.info("writing composite to Ceramic");

  const profileComposite = await createComposite(
    ceramic,
    "./composites/00-profile.graphql"
  );

  const researchFieldComposite = await createComposite(
    ceramic,
    "./composites/001-researchField.graphql"
  );

  const researchObjComposite = await createComposite(
    ceramic,
    "./composites/01-researchObject.graphql"
  );

  const orgComposite = await createComposite(
    ceramic,
    "./composites/02-organization.graphql"
  );

  const claimComposite = await createComposite(
    ceramic,
    "./composites/05-claim.graphql"
  );

  const attestationSchema = readFileSync(
    "./composites/06-attestation.graphql",
    { encoding: "utf-8"}
  ).replace("$CLAIM_ID", claimComposite.modelIDs[0]);

  const attestationComposite = await Composite.create({
    ceramic,
    schema: attestationSchema
  });

  const componentSchema = readFileSync(
    "./composites/07-researchComponent.graphql",
    { encoding: "utf-8"}
  ).replace("$RESEARCH_OBJECT_ID", researchObjComposite.modelIDs[0]);

  const componentComposite = await Composite.create({
    ceramic,
    schema: componentSchema
  });

  const referenceRelationSchema = readFileSync(
    "./composites/08-referenceRelation.graphql",
    { encoding: "utf-8"}
  ).replace("$RESEARCH_OBJECT_ID", researchObjComposite.modelIDs[0]);

  const referenceRelationComposite = await Composite.create({
    ceramic,
    schema: referenceRelationSchema
  });

  const contributorRelationSchema = readFileSync(
    "./composites/09-contributorRelation.graphql",
    { encoding: "utf-8"}
  ).replace("$RESEARCH_OBJECT_ID", researchObjComposite.modelIDs[0])
  .replace("$PROFILE_ID", profileComposite.modelIDs[0])

  const contributorRelationComposite = await Composite.create({
    ceramic,
    schema: contributorRelationSchema
  });

  const researchFieldRelationSchema = readFileSync(
    "./composites/10-researchFieldRelation.graphql",
    { encoding: "utf-8"}
  ).replace("$RESEARCH_OBJECT_ID", researchObjComposite.modelIDs[0])
  .replace("$RESEARCH_FIELD_ID", researchFieldComposite.modelIDs[0]);

  const researchFieldRelationComposite = await Composite.create({
    ceramic,
    schema: researchFieldRelationSchema
  });

  const annotationSchema = readFileSync(
    "./composites/11-annotation.graphql",
    { encoding: "utf-8"}
  ).replace("$CLAIM_ID", claimComposite.modelIDs[0]);

  const annotationComposite = await Composite.create({
    ceramic,
    schema: annotationSchema
  });

  const additionalRelationsSchema = readFileSync(
    "./composites/additional-relations.graphql",
    { encoding: "utf-8" }
  )
  .replace("$ATTESTATION_ID", attestationComposite.modelIDs[1])
  .replace("$CLAIM_ID", claimComposite.modelIDs[0])
  .replace("$RESEARCH_OBJECT_ID", researchObjComposite.modelIDs[0])
  .replace("$PROFILE_ID", profileComposite.modelIDs[0])
  .replace("$RESEARCH_COMPONENT_ID", componentComposite.modelIDs[1])
  .replace("$CONTRIBUTOR_RELATION_ID", contributorRelationComposite.modelIDs[2])
  .replace("$REFERENCE_RELATION_ID", referenceRelationComposite.modelIDs[1])
  .replace("$RESEARCH_FIELD_ID", researchFieldComposite.modelIDs[0])
  .replace("$RESEARCH_FIELD_RELATION_ID", researchFieldRelationComposite.modelIDs[2])
  .replace("$ANNOTATION_ID", annotationComposite.modelIDs[1]);

  const additionalRelationsComposite = await Composite.create({
    ceramic,
    schema: additionalRelationsSchema
  });

  const composite = Composite.from([
    profileComposite,
    researchObjComposite,
    orgComposite,
    claimComposite,
    attestationComposite,
    componentComposite,
    additionalRelationsComposite,
    contributorRelationComposite,
    referenceRelationComposite,
    researchFieldComposite,
    researchFieldRelationComposite,
    annotationComposite
   ]);

  await writeEncodedComposite(composite, "./src/__generated__/definition.json");
  spinner.info("creating composite for runtime usage");
  await writeEncodedCompositeRuntime(
    ceramic,
    "./src/__generated__/definition.json",
    "./src/__generated__/definition.js"
  );
  spinner.info("deploying composite");
  const deployComposite = await readEncodedComposite(
    ceramic,
    "./src/__generated__/definition.json"
  );

  await deployComposite.startIndexingOn(ceramic);
  spinner.succeed("composite deployed & ready for use");
};

/**
 * Authenticating DID for publishing composite
 * @return {Promise<void>} - return void when DID is authenticated.
 */
const authenticate = async () => {
  const seed = readFileSync("./admin_seed.txt");
  const key = fromString(seed, "base16");
  const did = new DID({
    resolver: getResolver(),
    provider: new Ed25519Provider(key),
  });
  await did.authenticate();
  ceramic.did = did;
};

