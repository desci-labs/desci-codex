import type { NextPage } from 'next'
import { useEffect, useState } from 'react';

import { useCeramicContext } from '../context';
import { ROProps } from '../types';

import Head from 'next/head'

import styles from "../styles/Home.module.scss"
import React from "react";
import ResearchObject from '../components/researchObject.components';

const ExplorePage: NextPage = () => {  
  const clients = useCeramicContext()
  const { composeClient } = clients
  const [ objects, setObjects ] = useState<ROProps[] | []>([])

  const getResearchObjects = async () => {
    const explore = await composeClient.executeQuery(`
      query {
        researchObjectIndex(first: 100) {
          edges {
            node {
              id
              title
              manifest
              author {
                profile {
                  displayName
                }
              }
            }
          }
        }
      }
    `)
    console.log("Explore:", JSON.stringify(explore, undefined, 2))
    // TODO: Sort based off of "created date"
    const objects: ROProps[] = []
    explore.data?.researchObjectIndex?.edges.map(ro => {
      objects.push({
        id: ro.node.id,
        title: ro.node.title,
        manifest: ro.node.manifest,
        profile: ro.node.author.profile
      })
    })
    
    //posts.sort((a,b)=> (new Date(b.created) - new Date(a.created)))
    setObjects(objects) // reverse to get most recent msgs
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