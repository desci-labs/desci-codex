"use client";
import { useState, useEffect, useCallback } from "react";
import { useCeramicContext } from "@/context";
import { Profile } from "@/types";
import styles from "@/styles/profile.module.scss";
import { mutationCreateProfile, queryViewerProfile } from "@/utils/queries";

export const UserForm = () => {
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;

  const [profile, setProfile] = useState<Profile | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const getProfile = useCallback(async () => {
    setLoading(true);
    if (ceramic.did !== undefined) {
      const profile = await queryViewerProfile(composeClient);
      if (profile === null) {
        console.log(
          "Failed to fetch profile, maybe user haven't created one yet"
        );
      } else {
        setProfile(profile);
      }
      setLoading(false);
    }
  }, [setLoading, setProfile, composeClient, ceramic.did]);

  const updateProfile = async () => {
    setLoading(true);
    if (ceramic.did !== undefined && profile !== undefined) {
      let success = true;
      try {
        await mutationCreateProfile(composeClient, profile);
      } catch (e) {
        alert((e as Error).message);
        success = false;
      }
      if (success) {
        await getProfile();
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  return (
    <>
      {profile === undefined && ceramic.did === undefined ? (
        <div className="content" />
      ) : (
        <div className="content">
          <div className={styles.formGroup}>
            <div className="">
              <label className="">Display name</label>
              <input
                className=""
                type="text"
                defaultValue={profile?.displayName || ""}
                onChange={(e) => {
                  setProfile({ ...profile, displayName: e.target.value });
                }}
              />
            </div>
            <div className="">
              <label>OrcID</label>
              <input
                type="text"
                defaultValue={profile?.orcid || ""}
                onChange={(e) => {
                  setProfile({ ...profile, orcid: e.target.value });
                }}
              />
            </div>
            <div className="">
              <button
                onClick={() => {
                  updateProfile();
                }}
              >
                {loading ? "Loading..." : "Update Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};