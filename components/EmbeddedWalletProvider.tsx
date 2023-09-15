import {
  useMemo,
  type PropsWithChildren,
  useCallback,
  useState,
  useEffect,
} from "react";
import { PrivyProvider } from "@privy-io/react-auth";

interface EmbeddedWalletProviderProps extends PropsWithChildren {
  orcidJwt: string | undefined;
}

const EmbeddedWalletProvider: React.FC<EmbeddedWalletProviderProps> = ({
  children,
  orcidJwt,
}) => {
  // Wrap getAccessTokenSilently as necessary (explained below)
  const getCustomToken = useCallback(async () => {
    // debugger;
    const orcidLocal = localStorage.getItem("orcid:idToken");
    return orcidLocal || orcidJwt || undefined;
  }, [orcidJwt]);

  return (
    <PrivyProvider
      appId="clmi0r5mc02s0l70f1p0es1af"
      config={{
        // CUSTOM AUTH CONFIGURATION
        customAuth: {
          // The `isLoading` boolean from Auth0's `useAuth0` indicates if Auth0 is currently
          // updating the user's auth state on the client or not
          isLoading: false,
          // The `getCustomToken` callback allows us to get the user's access/identity token
          // whenever their auth state changes
          getCustomAccessToken: getCustomToken,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};

export default EmbeddedWalletProvider;
