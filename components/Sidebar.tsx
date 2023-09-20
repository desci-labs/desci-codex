"use client";
import Image from "next/image";
import Link from "next/link";
import nodesLogo from "@/public/nodes.png";

import { FaHome, FaUser, FaHashtag, FaDoorClosed } from "react-icons/fa";
import { ConnectedWallet, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useOrcidWalletContext } from "./OrcidWalletProvider";
import { useCeramicContext } from "@/context";

interface SidebarProps {}

export const Sidebar = ({}: SidebarProps) => {
  /**
   * Privy
   */
  // const { wallets } = useWallets();
  // const [embeddedWallet, setEmbeddedWallet] = useState<
  //   ConnectedWallet | undefined
  // >();
  // useEffect(() => {
  //   // debugger;
  //   const wallet = wallets.find(
  //     (wallet) => wallet.walletClientType === "privy"
  //   );
  //   setEmbeddedWallet(wallet);
  // }, [wallets]);

  const { userAccount, orcidId, ensureProvider } = useOrcidWalletContext();
  const { ceramic } = useCeramicContext();

  return (
    <div className="sidebar">
      <div className="top">
        <div className="logoContainer">
          <Image src={nodesLogo} alt={"Nodes logo"} />
        </div>
        <Link href="/">
          <FaHome /> Home
        </Link>
        <Link href={`/profile`}>
          <FaUser /> Profile
        </Link>
        <Link href="/explore">
          <FaHashtag /> Explore
        </Link>
        <Link href="/logout">
          <FaDoorClosed /> Logout
        </Link>
        {/* <textarea
          value={
            embeddedWallet
              ? JSON.stringify(embeddedWallet)
              : "no privy orcid wallet"
          }
          readOnly
        ></textarea> */}
        <div>signer: {ceramic?.did?.parent || "no torus orcid wallet"}</div>
        <div>orcid: {orcidId || "not signed in orcid"}</div>
        <div>
          torus:{" "}
          {userAccount || (
            <>
              <button
                onClick={() => {
                  ensureProvider(null);
                }}
              >
                reconnect torus
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
