"use client";
import { useCeramicContext } from "@/context";
import { ResearchObject } from "@/types";
import styles from "@/styles/profile.module.scss";
import { useState } from "react";
import { mutationCreateResearchObject } from "@/utils/queries";

export const ResearchObjectForm = (updateParent: () => void) => {
  const { ceramic, composeClient } = useCeramicContext();
  const [object, setObject] = useState<ResearchObject>({
    title: "",
    manifest: ""
  });
  const [loading, setLoading] = useState<boolean>(false);

  const createResearchObject = async () => {
    setLoading(true);
    if (ceramic.did !== undefined) {
      const inputs = {
        title: object.title,
        manifest: object.manifest,
      };
      try {
        await mutationCreateResearchObject(composeClient, inputs);
      } catch (e) {
        alert((e as Error).message);
      }
      updateParent();
    }
    setLoading(false);
  };

  return (
    <>
      {ceramic.did === undefined ? (
        <div className="content"></div>
      ) : (
        <div className="">
          <div className={styles.formGroup}>
            <div className="">
              <label>Title</label>
              <input
                className=""
                type="text"
                onChange={(e) => {
                  setObject({ ...object, title: e.target.value });
                }}
              />
            </div>
            <div className="">
              <label>Manifest CID</label>
              <input
                type="text"
                onChange={(e) => {
                  setObject({ ...object, manifest: e.target.value });
                }}
              />
            </div>
            <div className="">
              <button
                onClick={() => {
                  createResearchObject();
                }}
              >
                {loading ? "Loading..." : "Create Research Object"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
