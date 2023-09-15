"use client";
import React, { useEffect, useState } from "react";
import { authenticateCeramic } from "@/utils";
import { useCeramicContext } from "@/context";
import { useSearchParams } from "next/navigation";

const AuthPrompt = () => {
  const query = useSearchParams();
  const code = query.get("code") as string;
  const logout = query.get("logout") as string;
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;
  const isLogged = () => {
    return localStorage.getItem("logged_in") == "true";
  };

  useEffect(() => {
    if (!code) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [code, logout]);

  useEffect(() => {
    const orcidToken = localStorage.getItem("orcid:idToken");

    setIsVisible(!orcidToken);
  }, [code]);

  const handleOpen = () => {
    if (localStorage.getItem("logged_in")) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const handleOrcid = async () => {
    const url = `https://sandbox.orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=http://localhost:3000/orcid/capture`;
    window.location.href = url;
  };

  const handleKeyDid = () => {
    localStorage.setItem("ceramic:auth_type", "key");
    setIsVisible(false);
    authenticateCeramic(ceramic, composeClient);
  };

  const handleEthPkh = () => {
    localStorage.setItem("ceramic:auth_type", "eth");
    setIsVisible(false);
    authenticateCeramic(ceramic, composeClient);
  };

  return (
    <div>
      {isVisible && (
        <div className="popup">
          <div className="popup-content">
            <h2>Authenticate</h2>
            {isLoading ? (
              <div>loading</div>
            ) : (
              <div>
                <span>
                  <button onClick={handleOrcid}>ORCiD</button>
                </span>
                <span>
                  <button onClick={handleKeyDid}>Key DID</button>
                </span>
                <span>
                  <button onClick={handleEthPkh}>Ethereum DID PKH</button>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPrompt;
