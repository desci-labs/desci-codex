import type { NextPage } from 'next'
import { useEffect, useState } from 'react';
import { useCeramicContext } from '../context';
import { ROProps } from '../types';
import Head from 'next/head'
import styles from "../styles/Home.module.scss"
import React from "react";
import ResearchObject from '../components/researchObject.components';
import { ResearchObjectForm } from '../components/roForm.component';
import { queryViewerId, queryViewerResearchObjects } from '../utils/queries';

const Home: NextPage = () => {  
  const clients = useCeramicContext()
  const { ceramic, composeClient } = clients
  const [ objects, setObjects ] = useState<ROProps[] | []>([])

  const getResearchObjects = async () => {
    if (ceramic.did !== undefined) {
      const viewerId = await queryViewerId(composeClient)
      localStorage.setItem("viewer", viewerId)

      const ownResearchObjects = await queryViewerResearchObjects(composeClient)
      setObjects(ownResearchObjects)
    }
  }

  useEffect(() => {
    getResearchObjects()
  }, [])

  return (
    <>
      <Head>
        <title>Nodes Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className = "content">
        { ResearchObjectForm(getResearchObjects) }
        <div className = { styles.postContainer }>
          <label><big>My research objects</big></label>
          {(objects).map(ro=> (
            <ResearchObject 
              key = { ro.id }
              id = { ro.id }
              title = { ro.title }
              manifest = { ro.manifest }
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default Home