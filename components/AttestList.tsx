"use client";

import { useEffect, useState } from "react";
import { useCeramicContext } from "@/context";
import { queryResearchObjectAttestations } from "@/utils/queries";
import { Attestation } from "@/types";

type AttestListProps = {
  targetID: string;
};

export const AttestList = ({ targetID }: AttestListProps) => {
  const { composeClient } = useCeramicContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [attestations, setAttestations] = useState<Attestation[]>([]);

  useEffect(() => {
    const getAttestations = async () => {
      setLoading(true);
      const attestations = await queryResearchObjectAttestations(
        composeClient,
        targetID
      );
      setAttestations(attestations);
      setLoading(false);
    };
    getAttestations();
  }, [composeClient, targetID]);

  return (
    <div className="">
      {loading
        ? "..."
        : attestations.map(
            (a) =>
              `[ ${a.claim?.title} (from ${a.source?.profile?.displayName})] `
          )}
    </div>
  );
};
