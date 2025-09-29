import '@pokemon-resources/pkg'
import { Type } from './types/types'

declare module '@pokemon-resources/pkg' {
  type FormeMetadata = {
    readonly type1: Type
    readonly type2?: Type
    readonly eggGroups: EggGroup[]
  }
}
