"use client";

import { useState } from "react";
import { useCeramicContext } from "@/context";
import { mutationCreateAttestation } from "@/utils/queries";

type AttestButtonProps = {
  targetID: string;
};

export const AttestButton = ({ targetID }: AttestButtonProps) => {
  const { composeClient } = useCeramicContext();
  const [loading, setLoading] = useState<boolean>(false);

  const createAttestation = async () => {
    setLoading(true);
    const inputs = {
      targetID,
      claimID:
        "kjzl6kcym7w8y9hnsan2s4tzxa96gyb59zf3ozu60f79o7na6i2yuafjatjy8rc",
      revoked: false,
    };
    await mutationCreateAttestation(composeClient, inputs);
    setLoading(false);
  };

  return (
    <div className="">
      <button onClick={() => createAttestation()}>
        {loading ? "Loading..." : "Attest"}
      </button>
    </div>
  );
};
