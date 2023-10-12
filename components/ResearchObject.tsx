"use client";
import Link from "next/link";
import styles from "@/styles/Home.module.scss";

import { ResearchObject } from "@/types";
import { PropsWithChildren } from "react";

const ResearchObject = ({
  owner,
  title,
  manifest,
  children,
}: PropsWithChildren<ResearchObject>) => {
  return (
    <div className={styles.post}>
      <div><big>{title}</big></div>
      { owner?.profile ? (<small>Author: {owner.profile.displayName}</small>) : <></> }
      <br/>
      <Link href={`https://ipfs.desci.com/ipfs/${manifest}`}>{manifest}</Link>
      {children}
    </div>
  );
};

export default ResearchObject;
