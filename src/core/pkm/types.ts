import { ConvertStrategy } from '@pkm-rs/pkg'

export type PkmConstructorOptions =
  | {
      encrypted?: boolean
      strategy?: never
    }
  | {
      encrypted?: never
      strategy: ConvertStrategy
    }
