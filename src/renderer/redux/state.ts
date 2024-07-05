import { AllPKMFields } from 'pokemon-files'
import { OHPKM } from '../../types/pkm'
import { PKMFile } from '../../types/pkm/util'
import { SAV } from '../../types/SAVTypes'
import { HomeData } from '../../types/SAVTypes/HomeData'
import { SaveCoordinates, SaveRefMap, StringToStringMap } from '../../types/types'

export interface LookupState {
  homeMons?: { [key: string]: OHPKM }
  gen12?: StringToStringMap
  gen345?: StringToStringMap
}

export interface AppState {
  homeData: HomeData
  saves: SAV<PKMFile>[]
  dragSource?: SaveCoordinates
  dragMon?: PKMFile
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToRelease: AllPKMFields[]
  lookup: LookupState
}

export interface RootState {
  app: AppState
  recentSaves: SaveRefMap
  resources: {
    resourcesPath?: string | undefined
  }
}
