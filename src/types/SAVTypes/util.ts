import { GameOfOrigin } from 'pokemon-resources'
import { PKMInterface } from '../interfaces'
import { PathData } from './path'
import { SAV } from './SAV'

export const SIZE_SM = 0x6be00
export const SIZE_USUM = 0x6cc00
export type LOOKUP_TYPE = 'gen12' | 'gen345'

export const DESAMUME_FOOTER_START =
  '|<--Snip above here to create a raw sav by excluding this DeSmuME savedata footer:'

// Keeping this as a comment for future saves

// export const GameColors: Record<GameOfOrigin, string> = {
//   [GameOfOrigin.LetsGoPikachu]: '#F5DA26',
//   [GameOfOrigin.LetsGoEevee]: '#D4924B',
//   [GameOfOrigin.Sword]: '#00A1E9',
//   [GameOfOrigin.Shield]: '#BF004F',
//   [GameOfOrigin.BrilliantDiamond]: '#44BAE5',
//   [GameOfOrigin.ShiningPearl]: '#DA7D99',
//   [GameOfOrigin.LegendsArceus]: '#36597B',
//   [GameOfOrigin.Scarlet]: '#F34134',
//   [GameOfOrigin.Violet]: '#8334B7',
// }

export interface PKMClass {
  new (arg: ArrayBuffer | PKMInterface, encrypted?: boolean): PKMInterface
  fromBytes(bytes: ArrayBuffer): PKMInterface
  getName(): string
}

export interface SAVClass {
  new (path: PathData, bytes: Uint8Array): SAV
  pkmType: PKMClass
  fileIsSave: (bytes: Uint8Array) => boolean
  includesOrigin: (origin: GameOfOrigin) => boolean
  lookupType?: 'gen12' | 'gen345'
  saveTypeName: string
  saveTypeID: string
  saveTypeAbbreviation: string
  getPluginIdentifier?: () => string
}

export type PKMTypeOf<Type> = Type extends SAV<infer X> ? X : never

export function supportsMon(saveType: SAVClass, dexNumber: number, formeNumber: number): boolean {
  return saveType.prototype.supportsMon(dexNumber, formeNumber)
}

export function getGameColor(saveType: SAVClass | undefined, origin: GameOfOrigin): string {
  return saveType?.prototype.gameColor.call({ origin })
}

export function getPluginIdentifier(saveType: SAVClass | undefined): string | undefined {
  return saveType?.prototype.getPluginIdentifier()
}

export function getGameName(saveType: SAVClass | undefined): string | undefined {
  return saveType?.prototype.getGameName()
}

export function hasDesamumeFooter(bytes: Uint8Array, expectedOffset: number): boolean {
  const possibleFooter = new TextDecoder().decode(bytes.slice(expectedOffset))

  return possibleFooter.startsWith(DESAMUME_FOOTER_START)
}
