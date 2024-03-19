import {authenticatedCeramicClient, newComposeClient} from '@desci-labs/desci-codex-lib/src/clients.js'
import {updateResearchObject} from '@desci-labs/desci-codex-lib/src/mutate.js'
import {Flags} from '@oclif/core'

import {BaseCommand} from '../index.js'

export default class ResearchObject extends BaseCommand {
  static description = 'Update a research object'

  static flags = {
    id: Flags.string({
      description: 'ID of the research object to update',
      required: true,
    }),
    license: Flags.string({
      char: 'l',
      description: 'License for research object contents',
    }),
    manifest: Flags.string({
      char: 'm',
      description: 'Manifest file CID',
    }),
    title: Flags.string({
      char: 't',
      description: 'Title of the research object',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ResearchObject)

    const ceramic = await authenticatedCeramicClient(flags.didSeed, flags.ceramicNode)
    const client = newComposeClient({ceramic})
    const ids = await updateResearchObject(client, {
      id: flags.id,
      license: flags.license,
      manifest: flags.manifest,
      title: flags.title,
    })
    this.log(`Research object updated:\nID: ${ids.streamID}\nCommit: ${ids.commitID}`)
  }
}
