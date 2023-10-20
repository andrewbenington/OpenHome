import { GamePKM, GamePKMType } from './GamePKM'
import { OHPKM } from './OHPKM'

export type PKM = GamePKM | OHPKM

export type PKMType = GamePKMType | typeof OHPKM
