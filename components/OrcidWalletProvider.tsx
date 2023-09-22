"use client";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import RPC from "@/utils/evm.ethers";
import { authenticateCeramic } from "@/utils";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/single-factor-auth";
import { useCeramicContext } from "@/context";
import { TorusServiceProvider } from "@tkey/service-provider-torus";
import ThresholdKey from "@tkey/core";
import TorusStorageLayer from "@tkey/storage-layer-torus";

interface OrcidWalletProviderProps extends PropsWithChildren {}

const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!;
let customAuthArgs = {};
let tKey: ThresholdKey;
if (typeof window !== "undefined") {
  customAuthArgs = {
    web3AuthClientId,
    baseUrl: `${window.location.origin}/torus-sw`,
    network: "sapphire_devnet", // based on the verifier network.
    uxMode: "popup", // or redirect
  };
  const serviceProvider = new TorusServiceProvider({
    enableLogging: false,
    customAuthArgs: customAuthArgs as any,
  });
  const storageLayer = new TorusStorageLayer({
    hostUrl: "https://metadata.tor.us",
  });
  tKey = new ThresholdKey({
    enableLogging: true,
    serviceProvider,
    storageLayer,
  });
}

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
// const web3auth = new Web3Auth({
//   clientId: web3AuthClientId, // Get your Client ID from Web3Auth Dashboard
//   web3AuthNetwork: "testnet",
//   usePnPKey: false,
// });
// const privateKeyProvider = new EthereumPrivateKeyProvider({
//   config: { chainConfig },
// });
// web3auth.init(privateKeyProvider);

interface OrcidWalletContextProps {
  setOrcidJwt: Function;
  ensureProvider: Function;
  signMessage: Function;
  userAccount: string | undefined;
  orcidId: string | undefined;
}

const OrcidWalletContext = createContext<OrcidWalletContextProps>({
  setOrcidJwt: () => {},
  ensureProvider: () => {},
  userAccount: undefined,
  orcidId: undefined,
  signMessage: () => {},
});

export const useOrcidWalletContext = () => useContext(OrcidWalletContext);

const OrcidWalletProvider = ({ children }: OrcidWalletProviderProps) => {
  const { ceramic, composeClient } = useCeramicContext();
  const [orcidJwt, setOrcidJwt] = useState<string | undefined>();
  const [orcidId, setOrcidId] = useState<string | undefined>();

  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<any>();
  const [oAuthShare, setOAuthShare] = useState<any>();
  const [provider, setProvider] = useState<any>();

  const [loadingAccount, setLoadingAccount] = useState(false);
  const [signedMessage, setSignedMessage] = useState("");
  const [loadingSign, setLoadingSign] = useState(false);
  const [loadingTxn, setLoadingTxn] = useState(false);
  const [userAccount, setUserAccount] = useState("");
  const [txnHash, setTxnHash] = useState("");

  useEffect(() => {
    const init = async () => {
      // Initialization of Service Provider
      try {
        await (tKey.serviceProvider as any).init();
      } catch (error) {
        console.error(error);
      }
    };
    init();
    const ethProvider = async () => {
      const ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          /*
            pass the chain config that you want to connect with
            all chainConfig fields are required.
            */
          chainConfig,
        },
      });
      /*
        pass user's private key here.
        after calling setupProvider, we can use
        */
      if (privateKey) {
        await ethereumPrivateKeyProvider.setupProvider(privateKey);
        console.log("eth provider", ethereumPrivateKeyProvider.provider);
        setProvider(ethereumPrivateKeyProvider.provider);
      }
    };
    ethProvider();
  }, [privateKey]);

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
    async (callback: any, force?: boolean) => {
      //   debugger;
      const idToken = localStorage.getItem("orcid:idToken");
      const serializedToken = "" + localStorage.getItem("orcid:idToken");
      return await new Promise<SafeEventEmitterProvider | null>(
        (resolve, reject) => {
          if (!provider) {
            if (idToken) {
              // debugger;
              const { sub } = parseToken(idToken);

              /**
               * Torus requires a previously unused JWT to be passed in to the connect method.
               * Ensure a fresh jwt is used by popping up a window and closing it immediately if user is logged in.
               */

              const url = `https://sandbox.orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=http://localhost:3000`;
              const offScreen = 8000;

              const sOptions = `height=1,width=1,toolbar=no,scrollbars=yes,location=yes,statusbar=yes,menubar=no,resizable=1,screenX=${offScreen},screenY=${offScreen}`;
              const sUrl = url + "/orcid/capture";
              const sName = "orcid";
              const popup = force
                ? undefined
                : window.open(sUrl, sName, sOptions);

              const timer = setInterval(async () => {
                const newToken = localStorage.getItem("orcid:idToken");

                if (force || newToken != serializedToken) {
                  popup?.close();
                  clearInterval(timer);

                  try {
                    const loginResponse = await (
                      tKey.serviceProvider as any
                    ).triggerLogin({
                      typeOfLogin: "jwt",
                      verifier: "orcid-sandbox-new",
                      clientId: process.env.NEXT_PUBLIC_ORCID_CLIENT_ID!,
                      jwtParams: {
                        id_token: newToken!,
                      },
                    });
                    const user = loginResponse.userInfo;
                    console.log("[torus loginResponse]", loginResponse);
                    setUser(loginResponse.userInfo);
                    setOAuthShare(loginResponse.privateKey);
                    setUserAccount(loginResponse.finalKeyData.evmAddress);
                  } catch (err) {
                    // await handleLogin();

                    callback && callback();
                    reject(err);
                  }
                }
              }, 2000);
            } else {
              alert("not signed into orcid");
              reject("not signed into orcid");
            }
          }
        }
      );
      //   debugger;
    },
    [provider]
  );
  useEffect(() => {
    window.onmessage = (e) => {
      e.data === "orcid:login" && ensureProvider(null, true);
    };
  }, [ensureProvider]);
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
    // debugger;
    setLoadingAccount(true);
    const newProvider: SafeEventEmitterProvider | null | undefined =
      await ensureProvider(null);
    setTimeout(async () => {
      //   debugger;
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
    // debugger;
    if (orcidJwt) {
      (async () => {
        console.log("did-session start");
        // await handleGetAccount();
        if (provider && userAccount) {
          authenticateCeramic(ceramic, composeClient, provider, userAccount);
        }
        console.log("did-session end");
      })();

      console.log("orcidjwt", orcidJwt);
    } else if (localStorage.getItem("did")) {
      authenticateCeramic(ceramic, composeClient);
    }
  }, [
    orcidJwt,
    handleGetAccount,
    provider,
    userAccount,
    ceramic,
    composeClient,
  ]);

  useEffect(() => {
    if (orcidJwt) {
      const { sub } = parseToken(orcidJwt);
      setOrcidId(sub);
      //   ensureProvider(null);
    }
  }, [orcidJwt]);

  const signMessage = async (): Promise<any> => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new RPC(provider);

    const signedMessage = await web3.signMessage("hello");

    return signedMessage;
  };

  return (
    <OrcidWalletContext.Provider
      value={{ signMessage, setOrcidJwt, userAccount, orcidId, ensureProvider }}
    >
      {children}
    </OrcidWalletContext.Provider>
  );
};

export default OrcidWalletProvider;
