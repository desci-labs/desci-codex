import type { NextPage } from 'next'
import { useEffect, useState } from 'react';
import { useCeramicContext } from '../context';
import { ROProps } from '../types';
import Head from 'next/head'
import styles from "../styles/Home.module.scss"
import React from "react";
import ResearchObject from '../components/researchObject.components';
import { queryResearchObjects } from '../utils/queries';

const ExplorePage: NextPage = () => {  
  const clients = useCeramicContext()
  const { composeClient } = clients
  const [ objects, setObjects ] = useState<ROProps[] | []>([])

  const getResearchObjects = async () => {
    const researchObjects = await queryResearchObjects(composeClient)
    setObjects(researchObjects)
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
        <div className = { styles.postContainer }>
          <label><big>The world of DeSci</big></label>
          {(objects).map(ro=> (
            <ResearchObject 
              key = { ro.id }
              id = { ro.id }
              title = { ro.title } 
              manifest = { ro.manifest } 
              profile = { ro.profile }
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default ExplorePage