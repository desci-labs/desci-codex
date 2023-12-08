import {authenticatedCeramicClient, newComposeClient} from '@desci-labs/desci-codex-lib/src/clients.js'
import {createResearchObject} from '@desci-labs/desci-codex-lib/src/mutate.js'
import {Flags} from '@oclif/core'

import {BaseCommand} from '../index.js'

export default class ResearchObject extends BaseCommand {
  static description = 'Create a new research object'

  static flags = {
    manifest: Flags.string({
      char: 'm',
      description: 'Manifest file CID',
      required: true,
    }),
    title: Flags.string({
      char: 't',
      description: 'Title of the research object',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ResearchObject)

    const ceramic = await authenticatedCeramicClient(flags.didSeed, flags.ceramicNode)
    const client = newComposeClient({ceramic})
    const ids = await createResearchObject(client, {
      manifest: flags.manifest,
      title: flags.title,
    })
    this.log(`Research object created:\nID: ${ids.streamID}\nCommit: ${ids.commitID}`)
  }
}
