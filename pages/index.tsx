import type { NextPage } from 'next'
import { useEffect, useState } from 'react';

import { useCeramicContext } from '../context';
import { ROProps } from '../types';

import Head from 'next/head'

import styles from "../styles/Home.module.scss"
import React from "react";
import ResearchObject from '../components/researchObject.components';
import { ResearchObjectForm } from '../components/roForm.component';

const Home: NextPage = () => {  
  const clients = useCeramicContext()
  const { composeClient } = clients
  const [ objects, setObjects ] = useState<ROProps[] | []>([])

  const getResearchObjects = async () => {
    const profile = await composeClient.executeQuery(`
        query {
          viewer {
            id
            profile {
              id
              displayName
              orcid
            }
          }
        }
      `);
    console.log("Profile:", JSON.stringify(profile, undefined, 2))
    localStorage.setItem("viewer", profile?.data?.viewer?.id)

    const ownResearchObjects = await composeClient.executeQuery(`
        query MyQuery {
          viewer {
            researchObjectList(first: 100) {
              edges {
                node {
                  id
                  manifest
                  title
                }
              }
            }
          }
        }
      `)

    // TODO: Sort based off of "created date"
    const objects: ROProps[] = []
    ownResearchObjects.data?.viewer?.researchObjectList?.edges.map(ro => {
      objects.push({
        id: ro.node.id,
        title: ro.node.title,
        manifest: ro.node.manifest
      })
    })
    
    //posts.sort((a,b)=> (new Date(b.created) - new Date(a.created)))
    console.log(objects)
    setObjects(objects) // reverse to get most recent msgs
  }

  useEffect(() => {
    getResearchObjects()
  })

  return (
    <>
      <Head>
        <title>Nodes Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className = "content">
        { ResearchObjectForm() }
        <div className = { styles.postContainer }>
          <label><big>My research objects</big></label>
          {(objects).map(ro=> (
            <ResearchObject 
              key = { ro.id } 
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