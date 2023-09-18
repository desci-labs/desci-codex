"use client";
import Image from "next/image";
import Link from "next/link";
import nodesLogo from "@/public/nodes.png";

import { FaHome, FaUser, FaHashtag } from "react-icons/fa";

export const Sidebar = () => {
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
      </div>
    </div>
  );
};
