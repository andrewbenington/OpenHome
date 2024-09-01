import { OHPKM } from '../../types/pkm/OHPKM'
import { PKMFile } from '../../types/pkm/util'
import { SAV } from '../../types/SAVTypes'
import { HomeData } from '../../types/SAVTypes/HomeData'
import { SaveCoordinates, SaveRefMap } from '../../types/types'

export interface LookupState {
  homeMons?: { [key: string]: OHPKM }
  gen12?: Record<string, string>
  gen345?: Record<string, string>
}

export interface AppState {
  homeData: HomeData
  saves: SAV<PKMFile>[]
  dragSource?: SaveCoordinates
  dragMon?: PKMFile
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToRelease: PKMFile[]
  lookup: LookupState
}

export interface RootState {
  app: AppState
  recentSaves: SaveRefMap
  resources: {
    resourcesPath?: string | undefined
  }
}
