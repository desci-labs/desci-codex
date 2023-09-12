import '../styles/globals.scss'

import {CeramicWrapper, useCeramicContext} from "../context";
import type { AppProps } from 'next/app'
import { authenticateCeramic } from '../utils';
import { useEffect, useState } from 'react';
import { Profile } from '../types';
import AuthPrompt from './did-select-popup';
import { Sidebar } from '../components/sidebar.component';
import { loadIfUninitialised } from '../utils/populate';

let doInitCheck = true

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { ceramic, composeClient } = useCeramicContext()
  const [_profile, setProfile] = useState<Profile| undefined>()

  const handleLogin = async () => {
    await authenticateCeramic(ceramic, composeClient)
    await getProfile()
  }

  const getProfile = async () => {
    if(ceramic.did !== undefined) {
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
      localStorage.setItem("viewer", profile?.data?.viewer?.id)
      
      setProfile(profile?.data?.viewer?.profile)
    }
  }

  // Update to include refresh on auth
  useEffect(() => {
    if(doInitCheck) {
      loadIfUninitialised(composeClient)
      doInitCheck = false
    }
    if(localStorage.getItem('logged_in')) {
      handleLogin()
      getProfile()
    }
  }, [])

  return (
      <div> <AuthPrompt/>
    <div className="container">
      <CeramicWrapper>
        <Sidebar />
        <div className="body">
          <Component {...pageProps} ceramic />
        </div>
      </CeramicWrapper>
    </div>
      </div>
  );
}

export default MyApp