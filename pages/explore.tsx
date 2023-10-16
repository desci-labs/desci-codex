import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import { useCeramicContext } from "@/context";
import { ResearchObject } from "@/types";
import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import React from "react";
import ResearchObjectComponent from "@/components/ResearchObject";
import { queryResearchObjects } from "@/utils/queries";
import { AttestButton } from "@/components/AttestButton";
import { AttestList } from "@/components/AttestList";

const ExplorePage: NextPage = () => {
  const clients = useCeramicContext();
  const { composeClient } = clients;
  const [objects, setObjects] = useState<ResearchObject[] | []>([]);

  const getResearchObjects = useCallback(async () => {
    const researchObjects = await queryResearchObjects(composeClient);
    setObjects(researchObjects);
  }, [composeClient]);

  useEffect(() => {
    getResearchObjects();
  }, [getResearchObjects]);

  return (
    <>
      <Head>
        <title>Nodes Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="content">
        <div className={styles.postContainer}>
          <label>
            <big>The world of DeSci</big>
          </label>
          {objects.map((ro) => (
            <ResearchObjectComponent
              key={ro.id}
              id={ro.id}
              title={ro.title}
              manifest={ro.manifest}
              owner={ro.owner}
            >
              <AttestButton targetID={ro.id!} />
              <AttestList targetID={ro.id!} />
            </ResearchObjectComponent>
          ))}
        </div>
      </div>
    </>
  );
};

export default ExplorePage;
