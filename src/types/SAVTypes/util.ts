import { GameOfOrigin } from 'pokemon-resources'
import { PKMInterface } from '../interfaces'
import { ParsedPath } from './path'
import { SAV } from './SAV'

export const SIZE_SM = 0x6be00
export const SIZE_USUM = 0x6cc00
export type LOOKUP_TYPE = 'gen12' | 'gen345'

export const DESAMUME_FOOTER_START =
  '|<--Snip above here to create a raw sav by excluding this DeSmuME savedata footer:'

export const GameColors: Record<GameOfOrigin, string> = {
  [0]: '#666666',
  [GameOfOrigin.INVALID_6]: '#000000',
  [GameOfOrigin.INVALID_9]: '#000000',
  [GameOfOrigin.INVALID_13]: '#000000',
  [GameOfOrigin.INVALID_14]: '#000000',
  [GameOfOrigin.INVALID_16]: '#000000',
  [GameOfOrigin.INVALID_17]: '#000000',
  [GameOfOrigin.INVALID_18]: '#000000',
  [GameOfOrigin.INVALID_19]: '#000000',
  [GameOfOrigin.INVALID_28]: '#000000',
  [GameOfOrigin.INVALID_29]: '#000000',
  [GameOfOrigin.INVALID_46]: '#000000',
  [GameOfOrigin.Red]: '#DA3914',
  [GameOfOrigin.BlueGreen]: '#2E50D8',
  [GameOfOrigin.BlueJapan]: '#2E50D8',
  [GameOfOrigin.Yellow]: '#FFD733',
  [GameOfOrigin.Gold]: '#DAA520',
  [GameOfOrigin.Silver]: '#C0C0C0 ',
  [GameOfOrigin.Crystal]: '#3D51A7',
  [GameOfOrigin.Ruby]: '#CD2236',
  [GameOfOrigin.Sapphire]: '#009652',
  [GameOfOrigin.Emerald]: '#009652',
  [GameOfOrigin.ColosseumXD]: '#604E82',
  [GameOfOrigin.FireRed]: '#F15C01 ',
  [GameOfOrigin.LeafGreen]: '#9FDC00',
  [GameOfOrigin.Diamond]: '#90BEED',
  [GameOfOrigin.Pearl]: '#DD7CB1',
  [GameOfOrigin.Platinum]: '#A0A08D',
  [GameOfOrigin.HeartGold]: '#E8B502',
  [GameOfOrigin.SoulSilver]: '#AAB9CF',
  [GameOfOrigin.Black]: '#444444',
  [GameOfOrigin.White]: '#E1E1E1',
  [GameOfOrigin.Black2]: '#303E51',
  [GameOfOrigin.White2]: '#EBC5C3',
  [GameOfOrigin.X]: '#025DA6',
  [GameOfOrigin.Y]: '#EA1A3E',
  [GameOfOrigin.OmegaRuby]: '#AB2813',
  [GameOfOrigin.AlphaSapphire]: '#26649C',
  [GameOfOrigin.GO]: '#000000',
  [GameOfOrigin.Sun]: '#F1912B',
  [GameOfOrigin.Moon]: '#5599CA',
  [GameOfOrigin.UltraSun]: '#E95B2B',
  [GameOfOrigin.UltraMoon]: '#226DB5',
  [GameOfOrigin.LetsGoPikachu]: '#F5DA26',
  [GameOfOrigin.LetsGoEevee]: '#D4924B',
  [GameOfOrigin.Sword]: '#00A1E9',
  [GameOfOrigin.Shield]: '#BF004F',
  [GameOfOrigin.BrilliantDiamond]: '#44BAE5',
  [GameOfOrigin.ShiningPearl]: '#DA7D99',
  [GameOfOrigin.LegendsArceus]: '#36597B',
  [GameOfOrigin.Scarlet]: '#F34134',
  [GameOfOrigin.Violet]: '#8334B7',
}

export interface PKMClass {
  new (arg: ArrayBuffer | PKMInterface, encrypted?: boolean): PKMInterface
  fromBytes(bytes: ArrayBuffer): PKMInterface
}

export interface SAVClass {
  new (path: ParsedPath, bytes: Uint8Array): SAV
  pkmType: PKMClass
  fileIsSave: (bytes: Uint8Array) => boolean
  lookupType?: 'gen12' | 'gen345'
  saveTypeName: string
}

export type AlphaUnderscore<T extends string = string> = T extends `${infer First}${infer Rest}`
  ? First extends '_' | Lowercase<First> | Uppercase<First>
    ? Rest extends ''
      ? T
      : AlphaUnderscore<Rest>
    : never
  : T

export type PKMTypeOf<Type> = Type extends SAV<infer X> ? X : never

export function supportsMon(saveType: SAVClass, dexNumber: number, formeNumber: number): boolean {
  return saveType.prototype.supportsMon(dexNumber, formeNumber)
}

export function hasDesamumeFooter(bytes: Uint8Array, expectedOffset: number): boolean {
  const possibleFooter = new TextDecoder().decode(bytes.slice(expectedOffset))
  return possibleFooter.startsWith(DESAMUME_FOOTER_START)
}
