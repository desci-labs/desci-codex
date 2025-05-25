import KeyDIDResolver from "key-did-resolver";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { DID } from "dids";
import { fromString } from "uint8arrays/from-string";

export const didFromPkey = async (pkey: string) => {
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
