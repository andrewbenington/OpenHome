import { OHPKM, PKM } from 'types/PKMTypes'
import { SAV } from 'types/SAVTypes'
import { HomeData } from 'types/SAVTypes/HomeData'
import { SaveCoordinates, SaveRefMap, StringToStringMap } from 'types/types'

export interface LookupState {
  homeMons?: { [key: string]: OHPKM }
  gen12?: StringToStringMap
  gen345?: StringToStringMap
}

export interface AppState {
  homeData: HomeData
  saves: SAV[]
  dragSource?: SaveCoordinates
  dragMon?: PKM
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToDelete: OHPKM[]
  lookup: LookupState
}

export interface RootState {
  app: AppState
  recentSaves: SaveRefMap
  resources: {
    resourcesPath?: string | undefined
  }
}
