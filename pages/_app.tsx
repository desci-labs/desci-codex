import "@/styles/globals.scss";

import { CeramicWrapper, useCeramicContext } from "@/context";
import type { AppProps } from "next/app";
import { authenticateCeramic } from "@/utils";
import { useCallback, useEffect, useState } from "react";
import AuthPrompt from "@/components/AuthPrompt";
import { Sidebar } from "@/components/Sidebar";
import { loadIfUninitialised } from "@/utils/populate";
import { queryViewerId } from "@/utils/queries";
import EmbeddedWalletProvider from "@/components/EmbeddedWalletProvider";
import RPC from "@/utils/evm.ethers";
import { Web3Auth } from "@web3auth/single-factor-auth";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import {
  CustomChainConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";

let doInitCheck = true;

const chainConfig: CustomChainConfig = {
  chainNamespace: "eip155",
  chainId: "0x5",
  rpcTarget:
    "https://eth-goerli.g.alchemy.com/v2/cbyr8KsvbwnOsxPszgRkiJU9r7KqcsXO",
  displayName: "Ethereum Goerli",
  blockExplorer: "https://goerli.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};
const web3auth = new Web3Auth({
  clientId:
    "BNEax8qoe0LpzrzELcDx_IDP2iZzkzwMaG4aZll3g21Ni9Tconvb9g6oNEoH3myYUR0a2Bga3VeGkGMAQygQSUo", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "testnet",
  usePnPKey: false,
});
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});
web3auth.init(privateKeyProvider);

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

  const [orcidJwt, setOrcidJwt] = useState<string | undefined>();

  const [orcidData, setOrcidData] = useState<any>(null);
  const [provider, setProvider] = useState<any>();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [signedMessage, setSignedMessage] = useState("");
  const [loadingSign, setLoadingSign] = useState(false);
  const [loadingTxn, setLoadingTxn] = useState(false);
  const [userAccount, setUserAccount] = useState("");
  const [txnHash, setTxnHash] = useState("");
  const parseToken = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace("-", "+").replace("_", "/");
      return JSON.parse(window.atob(base64 || ""));
    } catch (err) {
      console.error(err);
      return null;
    }
  };
  const ensureProvider = useCallback(
    async (callback: any) => {
      const idToken = localStorage.getItem("orcid:idToken");
      if (!provider) {
        if (idToken) {
          // debugger;
          const { sub } = parseToken(idToken);

          try {
            const web3authSfaprovider = await web3auth.connect({
              verifier: "orcid",
              verifierId: sub,
              idToken,
            });

            setProvider(web3authSfaprovider);
            return web3authSfaprovider;
          } catch (err) {
            await handleLogin();

            callback && callback();
          }
        } else {
          alert("not signed into orcid");
        }
      }
    },
    [handleLogin, provider]
  );

  const handleSign = async () => {
    setLoadingSign(true);
    const newProvider: SafeEventEmitterProvider | null | undefined =
      await ensureProvider(handleSign);

    if (!newProvider && !provider) {
      return;
    }
    const rpc = new RPC(provider ? provider : newProvider);

    const userAccount = await rpc.getAccounts();
    setUserAccount(userAccount);
    // debugger;
    const msg =
      (document.getElementById("msg") as HTMLTextAreaElement).value || "";
    const msgSigned = await rpc.signMessage(msg);
    setSignedMessage(msgSigned);
    setLoadingSign(false);
  };

  const handleSubmitTxn = async () => {
    setLoadingTxn(true);
    if (!confirm("really do it?")) {
      setLoadingTxn(false);
      return;
    }
    const newProvider: SafeEventEmitterProvider | null | undefined =
      await ensureProvider(handleSubmitTxn);
    setTimeout(async () => {
      if (!newProvider && !provider) {
        return;
      }
      const rpc = new RPC(provider ? provider : newProvider);

      const userAccount = await rpc.getAccounts();
      setUserAccount(userAccount);

      const txn = await rpc.signAndSendTransaction();

      setTxnHash(txn);
      setLoadingTxn(false);
    });
  };

  const handleGetAccount = useCallback(async () => {
    setLoadingAccount(true);
    const newProvider: SafeEventEmitterProvider | null | undefined =
      await ensureProvider(handleGetAccount);
    setTimeout(async () => {
      if (!newProvider && !provider) {
        return;
      }
      const rpc = new RPC(provider ? provider : newProvider);
      const userAccount = await rpc.getAccounts();

      setUserAccount(userAccount);

      setLoadingAccount(false);
    });
  }, [provider, ensureProvider]);

  useEffect(() => {
    if (orcidJwt) {
      handleGetAccount();
      console.log("orcidjwt", orcidJwt);
    }
  }, [orcidJwt, handleGetAccount]);

  return (
    <div>
      <AuthPrompt setOrcidJwt={setOrcidJwt} />
      <div className="container">
        <EmbeddedWalletProvider orcidJwt={orcidJwt}>
          <CeramicWrapper>
            <Sidebar userAccount={userAccount} />
            <div className="body">
              <Component {...pageProps} ceramic />
            </div>
          </CeramicWrapper>
        </EmbeddedWalletProvider>
      </div>
    </div>
  );
};

export default MyApp;
