import "@/styles/globals.scss";

import { CeramicWrapper, useCeramicContext } from "@/context";
import type { AppProps } from "next/app";
import { authenticateCeramic } from "@/utils";
import { useCallback, useEffect, useState } from "react";
import AuthPrompt from "@/components/AuthPrompt";
import { Sidebar } from "@/components/Sidebar";
import { loadIfUninitialised } from "@/utils/populate";
import { queryViewerId } from "@/utils/queries";
import OrcidWalletProvider from "@/components/OrcidWalletProvider";

let doInitCheck = true;

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { ceramic, composeClient } = useCeramicContext();

  const setViewerId = useCallback(async () => {
    if (ceramic.did !== undefined) {
      const viewerId = await queryViewerId(composeClient);
      localStorage.setItem("viewer", viewerId);
    }
  }, [ceramic.did, composeClient]);

  const handleLogin = useCallback(async () => {
    await authenticateCeramic(ceramic, composeClient);
    await setViewerId();
  }, [ceramic, composeClient, setViewerId]);

  // Update to include refresh on auth
  useEffect(() => {
    if (doInitCheck) {
      loadIfUninitialised(composeClient);
      doInitCheck = false;
    }
    if (localStorage.getItem("logged_in")) {
      handleLogin();
      setViewerId();
    }
  }, [composeClient, handleLogin, setViewerId]);

  return (
    <div>
      <OrcidWalletProvider>
        <AuthPrompt />
        <div className="container">
          {/* <EmbeddedWalletProvider orcidJwt={orcidJwt}> */}
          <CeramicWrapper>
            <Sidebar />
            <div className="body">
              <Component {...pageProps} ceramic />
            </div>
          </CeramicWrapper>

          {/* </EmbeddedWalletProvider> */}
        </div>
      </OrcidWalletProvider>
    </div>
  );
};

export default MyApp;
