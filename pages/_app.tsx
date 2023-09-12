import '../styles/globals.scss'

import {CeramicWrapper, useCeramicContext} from "../context";
import type { AppProps } from 'next/app'
import { authenticateCeramic } from '../utils';
import { useEffect } from 'react';
import AuthPrompt from './did-select-popup';
import { Sidebar } from '../components/sidebar.component';
import { loadIfUninitialised } from '../utils/populate';
import { queryViewerId } from '../utils/queries';

let doInitCheck = true

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { ceramic, composeClient } = useCeramicContext()

  const handleLogin = async () => {
    await authenticateCeramic(ceramic, composeClient)
    await setViewerId()
  }

  const setViewerId = async () => {
    if(ceramic.did !== undefined) {
      const viewerId = await queryViewerId(composeClient)
      localStorage.setItem("viewer", viewerId)
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
      setViewerId()
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