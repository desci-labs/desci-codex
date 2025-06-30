import KeyDIDResolver from "key-did-resolver";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { DID } from "dids";
import { fromString } from "uint8arrays/from-string";

export const didFromPkey = async (pkey: string) => {
  if (!pkey || typeof pkey !== "string") {
    throw new Error("Private key must be a non-empty string");
  }

  // Validate base16 format
  if (!/^[0-9a-fA-F]+$/.test(pkey)) {
    throw new Error("Private key must be a valid base16 string");
  }

  const keyResolver = KeyDIDResolver.getResolver();
  const key = fromString(pkey, "base16");

  const did = new DID({
    provider: new Ed25519Provider(key),
    resolver: {
      ...keyResolver,
    },
  });
  await did.authenticate();
  return did;
};
