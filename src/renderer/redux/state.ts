import { OHPKM } from '../../types/PKMTypes'
import { GamePKM } from '../../types/PKMTypes/GamePKM'
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
  saves: SAV<GamePKM>[]
  dragSource?: SaveCoordinates
  dragMon?: GamePKM | OHPKM
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToRelease: OHPKM[]
  lookup: LookupState
}

export interface RootState {
  app: AppState
  recentSaves: SaveRefMap
  resources: {
    resourcesPath?: string | undefined
  }
}
