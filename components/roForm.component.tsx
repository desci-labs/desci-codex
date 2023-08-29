import { useCeramicContext } from '../context'
import { Profile, ROProps } from '../types'
import { authenticateCeramic } from '../utils'
import styles from '../styles/profile.module.scss'
import { useEffect, useState } from 'react'

export const ResearchObjectForm = () => {
  const { ceramic, composeClient } = useCeramicContext()
  const [profile, setProfile] = useState<Profile | undefined>()
  const [object, setObject] = useState<ROProps>({
    id: "",
    title: "",
    manifest: "",
    profile: {}
  })
  const [loading, setLoading] = useState<boolean>(false)

  const handleLogin = async () => {
    await authenticateCeramic(ceramic, composeClient)
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

  const createResearchObject = async () => {
    setLoading(true)
    if (ceramic.did !== undefined) {
      const create = await composeClient.executeQuery(
        `
          mutation {
            createResearchObject(input: {
              content: {
                title: "${object?.title}"
                manifest: "${object?.manifest}"
              }
            })
            {
              document {
                title
                manifest
              }
            }
          }
        `
      )
      if (create.errors) {
        alert(create.errors)
      } else {
        alert("Created research object.")
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    getProfile()
  }, [])

  return (
    <>
      {ceramic.did === undefined && profile === undefined ? (
        <div className="content">
        </div>
      ) : (
        <div className="">
          <div className={ styles.formGroup }>
            <div className="">
              <label>Title</label>
              <input
                className=""
                type="text"
                onChange={(e) => {
                  setObject({ ...object, title: e.target.value, profile: profile })
                }}
              />
            </div>
            <div className="">
              <label>Manifest CID</label>
              <input
                type="text"
                onChange={(e) => {
                  setObject({ ...object, manifest: e.target.value })
                }}
              />
            </div>
            <div className="">
              <button
                onClick={() => {
                  createResearchObject()
                }}
              >
                {loading ? 'Loading...' : 'Create Research Object'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

