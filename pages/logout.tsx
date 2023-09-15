import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import { useCeramicContext } from "@/context";
import { ROProps } from "@/types";
import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import React from "react";
import ResearchObject from "@/components/ResearchObject";
import { queryResearchObjects } from "@/utils/queries";
import { AttestButton } from "@/components/AttestButton";
import { AttestList } from "@/components/AttestList";

const LogoutPage: NextPage = () => {
  const clients = useCeramicContext();
  const { composeClient } = clients;

  useEffect(() => {
    localStorage.clear();
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }, []);

  return (
    <>
      <h1>logging out</h1>
    </>
  );
};

export default LogoutPage;
