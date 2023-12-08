import {Command, Flags} from '@oclif/core'

export abstract class BaseCommand extends Command {
  static baseFlags = {
    ceramicNode: Flags.string({
      char: 'c',
      default: 'http://localhost:7007',
      description: 'Ceramic node URL',
    }),
    didSeed: Flags.string({
      description: 'DID seed for authentication with Ceramic client',
      required: true,
    }),
  }
}
