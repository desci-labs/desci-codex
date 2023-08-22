import { CommitID, StreamID } from "@ceramicnetwork/streamid"

console.log('Recieved args:', process.argv)
const commitID = CommitID.fromString(process.argv[2])

console.log('stream CID:', commitID.cid)
