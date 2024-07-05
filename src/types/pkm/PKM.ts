import { OHPKM } from '../OHPKM'
import { GamePKM, GamePKMType } from './GamePKM'

export type PKM = GamePKM | OHPKM

export type PKMType = GamePKMType | typeof OHPKM
