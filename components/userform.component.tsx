
import { useState, useEffect } from 'react'
import { authenticateCeramic } from '../utils'
import { useCeramicContext } from '../context'

import { Profile } from "../types"

import styles from "../styles/profile.module.scss"

export const Userform = () => {
  const clients = useCeramicContext()
  const { ceramic, composeClient } = clients

  const [profile, setProfile] = useState<Profile | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const handleLogin = async () => {
    await authenticateCeramic(ceramic, composeClient)
    await getProfile()
  }

  const getProfile = async () => {
    setLoading(true)
    if (ceramic.did !== undefined) {
      const profile = await composeClient.executeQuery(`
        query {
          viewer {
            profile {
              id
              displayName
              orcid
            }
          }
        }
      `);
      setProfile(profile?.data?.viewer?.profile)
      setLoading(false);
    }
  }

  const updateProfile = async () => {
    setLoading(true);
    if (ceramic.did !== undefined) {
      const update = await composeClient.executeQuery(`
        mutation {
          createProfile(input: {
            content: {
              displayName: "${profile?.displayName}"
              orcid: "${profile?.orcid}"
            }
          }) 
          {
            document {
              displayName
              orcid
            }
          }
        }
      `);
      if(update.errors){
        alert(update.errors);
      } else {
        alert("Updated profile.")
        setLoading(true)
        const updatedProfile = await composeClient.executeQuery(`
          query {
            viewer {
              profile {
                id
                displayName
                orcid
              }
            }
          }
        `);
        setProfile(updatedProfile?.data?.viewer?.profile)
      }
      setLoading(false);
    }
  }

  useEffect(() => {
    getProfile()
  }, [])

  return (
    <>
      {profile === undefined && ceramic.did === undefined ? (
        <div className="content">
          <button
            onClick={() => {
              handleLogin();
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <div className="content">
          <div className={styles.formGroup}>
            <div className="">
              <label className="">Display name</label>
              <input
                className=""
                type="text"
                defaultValue={profile?.displayName || ''}
                onChange={(e) => {
                  setProfile({ ...profile, displayName: e.target.value });
                }}
              />
            </div>
            <div className="">
              <label>OrcID</label>
              <input
                type="text"
                defaultValue={profile?.orcid || ''}
                onChange={(e) => {
                  setProfile({ ...profile, orcid: e.target.value });
                }}
              />
            </div>
            <div className="">
              <button
                onClick={() => {
                  updateProfile();
                }}>
                {loading ? 'Loading...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}