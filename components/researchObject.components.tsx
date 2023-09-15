import Link from "next/link"
import styles from "../styles/Home.module.scss"

import { ROProps } from "../types"
import { PropsWithChildren } from "react"

const ResearchObject = ({ owner, title, manifest, children }: PropsWithChildren<ROProps>) => {
  return (
    <div className = {styles.post} >
      <div><big>{title}</big></div>
      { owner?.profile ? (<div><small>Author: {owner.profile.displayName}</small></div>) : <></>}
      <Link href = {`https://ipfs.desci.com/ipfs/${manifest}`}>
        { manifest }
      </Link>
      { children }
    </div>
  )
}

export default ResearchObject