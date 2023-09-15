"use client";
import Image from "next/image";
import Link from "next/link";
import nodesLogo from "@/public/nodes.png";

import { FaHome, FaUser, FaHashtag, FaDoorClosed } from "react-icons/fa";
import { ConnectedWallet, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

interface SidebarProps {
  userAccount: string;
}

export const Sidebar = ({ userAccount }: SidebarProps) => {
  const { wallets } = useWallets();
  const [embeddedWallet, setEmbeddedWallet] = useState<
    ConnectedWallet | undefined
  >();
  useEffect(() => {
    // debugger;
    const wallet = wallets.find(
      (wallet) => wallet.walletClientType === "privy"
    );
    setEmbeddedWallet(wallet);
  }, [wallets]);

  const [acct, setAcct] = useState<string>();

  useEffect(() => {
    console.log("USER ACCOUNT", userAccount);
    // debugger;
    if (userAccount) {
      setAcct(userAccount);
    }
  }, [userAccount]);

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
        <textarea>
          {embeddedWallet
            ? JSON.stringify(embeddedWallet)
            : "no privy orcid wallet"}
        </textarea>
        <div>torus: {acct || "no torus orcid wallet"}</div>
      </div>
    </div>
  );
};
