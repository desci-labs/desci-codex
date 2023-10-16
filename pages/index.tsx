import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import { useCeramicContext } from "@/context";
import { ResearchObject } from "@/types";
import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import React from "react";
import ResearchObjectComponent from "@/components/ResearchObject";
import { ResearchObjectForm } from "@/components/ResearchObjectForm";
import { queryViewerId, queryViewerResearchObjects } from "@/utils/queries";

const Home: NextPage = () => {
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;
  const [objects, setObjects] = useState<ResearchObject[] | []>([]);

  const getResearchObjects = useCallback(async () => {
    if (ceramic.did !== undefined) {
      const viewerId = await queryViewerId(composeClient);
      localStorage.setItem("viewer", viewerId);

      const ownResearchObjects = await queryViewerResearchObjects(
        composeClient
      );
      setObjects(ownResearchObjects);
    }
  }, [ceramic.did, composeClient]);

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
        {ResearchObjectForm(getResearchObjects)}
        <div className={styles.postContainer}>
          <label>
            <big>My research objects</big>
          </label>
          {objects.map((ro) => (
            <ResearchObjectComponent
              key={ro.id}
              id={ro.id}
              title={ro.title}
              manifest={ro.manifest}
              owner={ro.owner}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
