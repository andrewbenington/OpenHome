/* eslint-disable no-unused-vars */
import { Origin } from '../types/types'

export const GameOfOriginData: (Origin | null)[] = [
  null,
  { name: 'Sapphire', region: 'Hoenn', gc: 8 },
  { name: 'Ruby', region: 'Hoenn', gc: 9 },
  { name: 'Emerald', region: 'Hoenn', gc: 10 },
  { name: 'FireRed', region: 'Kanto', gc: 1 },
  { name: 'LeafGreen', region: 'Kanto', gc: 2 },
  null,
  { name: 'HeartGold', region: 'Johto' },
  { name: 'SoulSilver', region: 'Johto' },
  null,
  { name: 'Diamond', region: 'Sinnoh' },
  { name: 'Pearl', region: 'Sinnoh' },
  { name: 'Platinum', region: 'Sinnoh' },
  null,
  null,
  { name: 'Colosseum/XD', region: 'Orre', gc: 11 },
  null,
  null,
  null,
  null,
  { name: 'White', region: 'Unova' },
  { name: 'Black', region: 'Unova' },
  { name: 'White 2', region: 'Unova' },
  { name: 'Black 2', region: 'Unova' },
  { name: 'X', region: 'Kalos', mark: 'G6' },
  { name: 'Y', region: 'Kalos', mark: 'G6' },
  { name: 'Alpha Sapphire', region: 'Hoenn', mark: 'G6' },
  { name: 'Omega Ruby', region: 'Hoenn', mark: 'G6' },
  null,
  null,
  { name: 'Sun', region: 'Alola', mark: 'Alola' },
  { name: 'Moon', region: 'Alola', mark: 'Alola' },
  { name: 'Ultra Sun', region: 'Alola', mark: 'Alola' },
  { name: 'Ultra Moon', region: 'Alola', mark: 'Alola' },
  { name: 'GO', region: 'real world', mark: 'GO' },
  { name: 'Red', region: 'Kanto', mark: 'GB' },
  { name: 'Blue/Green', region: 'Kanto', mark: 'GB', logo: 'BlueGreen' },
  { name: 'Blue (Japan)', region: 'Kanto', mark: 'GB', logo: 'BlueJP' },
  { name: 'Yellow', region: 'Kanto', mark: 'GB' },
  { name: 'Gold', region: 'Johto', mark: 'GB' },
  { name: 'Silver', region: 'Johto', mark: 'GB' },
  { name: 'Crystal', region: 'Johto', mark: 'GB' },
  {
    name: "Let's Go, Pikachu!",
    region: 'Kanto',
    mark: 'LGPE',
    logo: 'LetsGoPikachu',
  },
  {
    name: "Let's Go, Eevee!",
    region: 'Kanto',
    mark: 'LGPE',
    logo: 'LetsGoEevee',
  },
  { name: 'Sword', region: 'Galar', mark: 'Galar' },
  { name: 'Shield', region: 'Galar', mark: 'Galar' },
  null,
  {
    name: 'Legends: Arceus',
    region: 'Hisui',
    mark: 'LA',
    logo: 'LegendsArceus',
  },
  { name: 'Brilliant Diamond', region: 'Sinnoh', mark: 'BDSP' },
  { name: 'Shining Pearl', region: 'Sinnoh', mark: 'BDSP' },
  { name: 'Scarlet', region: 'Paldea', mark: 'Tera' },
  { name: 'Violet', region: 'Paldea', mark: 'Tera' },
]

export const GameOfOriginDataGC = [
  null,
  { name: 'FireRed', region: 'Kanto', gba: 4 },
  { name: 'LeafGreen', region: 'Kanto', gba: 5 },
  null,
  null,
  null,
  null,
  null,
  { name: 'Sapphire', region: 'Hoenn', gba: 1 },
  { name: 'Ruby', region: 'Hoenn', gba: 2 },
  { name: 'Emerald', region: 'Hoenn', gba: 3 },
  { name: 'Colosseum/XD', region: 'Orre', gba: 15 },
]

export enum GameOfOrigin {
  INVALID_0,
  Sapphire,
  Ruby,
  Emerald,
  FireRed,
  LeafGreen,
  INVALID_6,
  HeartGold,
  SoulSilver,
  INVALID_9,
  Diamond,
  Pearl,
  Platinum,
  INVALID_13,
  INVALID_14,
  ColosseumXD,
  INVALID_16,
  INVALID_17,
  INVALID_18,
  INVALID_19,
  White,
  Black,
  White2,
  Black2,
  X,
  Y,
  AlphaSapphire,
  OmegaRuby,
  INVALID_28,
  INVALID_29,
  Sun,
  Moon,
  UltraSun,
  UltraMoon,
  GO,
  Red,
  BlueGreen,
  BlueJapan,
  Yellow,
  Gold,
  Silver,
  Crystal,
  LetsGoPikachu,
  LetsGoEevee,
  Sword,
  Shield,
  INVALID_46,
  LegendsArceus,
  BrilliantDiamond,
  ShiningPearl,
  Scarlet,
  Violet,
}

export const isAlola = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.Sun && origin <= GameOfOrigin.UltraMoon
}

export const isGalar = (origin: GameOfOrigin) => {
  return origin === GameOfOrigin.Sword || origin === GameOfOrigin.Shield
}

export const isGen1 = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.Red && origin <= GameOfOrigin.Yellow
}

export const isGen2 = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.Gold && origin <= GameOfOrigin.Crystal
}

export const isGBA = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.Sapphire && origin <= GameOfOrigin.LeafGreen
}

export const isGen3 = (origin: GameOfOrigin) => {
  return isGBA(origin) || origin === GameOfOrigin.ColosseumXD
}

export const isGen4 = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.HeartGold && origin <= GameOfOrigin.Platinum
}

export const isGen5 = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.White && origin <= GameOfOrigin.Black2
}

export const isUnova = (origin: GameOfOrigin) => {
  return isGen5(origin)
}

export const isGen6 = (origin: GameOfOrigin) => {
  return origin >= GameOfOrigin.X && origin <= GameOfOrigin.OmegaRuby
}

export const isKalos = (origin: GameOfOrigin) => {
  return isGen6(origin)
}

export const isLetsGo = (origin: GameOfOrigin) => {
  return origin === GameOfOrigin.LetsGoPikachu || origin === GameOfOrigin.LetsGoEevee
}

export const isGen7 = (origin: GameOfOrigin) => {
  return isAlola(origin) || isLetsGo(origin)
}

export const isBDSP = (origin: GameOfOrigin) => {
  return origin === GameOfOrigin.BrilliantDiamond || origin === GameOfOrigin.ShiningPearl
}

export const isGen8 = (origin: GameOfOrigin) => {
  return isGalar(origin) || isBDSP(origin) || origin === GameOfOrigin.LegendsArceus
}

export const isGen9 = (origin: GameOfOrigin) => {
  return origin === GameOfOrigin.Scarlet || origin === GameOfOrigin.Violet
}

export const isKanto = (origin: GameOfOrigin) => {
  return (
    isGen1(origin) ||
    origin === GameOfOrigin.FireRed ||
    origin === GameOfOrigin.LeafGreen ||
    origin === GameOfOrigin.LetsGoPikachu ||
    origin === GameOfOrigin.LetsGoEevee
  )
}

export const isJohto = (origin: GameOfOrigin) => {
  return isGen2(origin) || origin === GameOfOrigin.HeartGold || origin === GameOfOrigin.SoulSilver
}

export const isHoenn = (origin: GameOfOrigin) => {
  return (
    origin === GameOfOrigin.Sapphire ||
    origin === GameOfOrigin.Ruby ||
    origin === GameOfOrigin.Emerald ||
    origin === GameOfOrigin.AlphaSapphire ||
    origin === GameOfOrigin.OmegaRuby
  )
}

export const isSinnoh = (origin: GameOfOrigin) => {
  return (
    origin === GameOfOrigin.Diamond ||
    origin === GameOfOrigin.Pearl ||
    origin === GameOfOrigin.Platinum ||
    origin === GameOfOrigin.BrilliantDiamond ||
    origin === GameOfOrigin.ShiningPearl
  )
}

export const gameOfOriginFromFormat = (format: string) => {
  let game
  switch (format) {
    case 'PK2':
      game = GameOfOrigin.Crystal
      break
    case 'PK3':
      game = GameOfOrigin.Sapphire
      break
    case 'PK4':
      game = GameOfOrigin.SoulSilver
      break
    case 'PK5':
      game = GameOfOrigin.White2
      break
    case 'PK6':
      game = GameOfOrigin.OmegaRuby
      break
    case 'PK7':
      game = GameOfOrigin.Moon
      break
    case 'PB7':
      game = GameOfOrigin.LetsGoEevee
      break
    case 'PK8':
      game = GameOfOrigin.Shield
      break
    case 'PA8':
      game = GameOfOrigin.LegendsArceus
      break
    case 'PB8':
      game = GameOfOrigin.BrilliantDiamond
      break
    case 'PK9':
      game = GameOfOrigin.Scarlet
      break
  }
  return game
}

const ColosseumOnlyNonShadow = [311]

const ColosseumOnlyShadow = [
  153, 154, 156, 157, 159, 160, 162, 164, 176, 468, 185, 188, 189, 190, 192, 193, 195, 198, 200,
  206, 207, 210, 211, 213, 214, 215, 218, 223, 461, 472, 469, 430, 429, 982, 223, 224, 225, 226,
  227, 234, 899, 235, 237, 241, 243, 244, 245, 248, 250, 307, 308, 329, 330, 333, 357, 359, 376,
]

const CXDShadow = [166, 168, 180, 181, 196, 197, 205, 217, 219, 221, 473, 901, 229, 296, 297, 334]

const CXDNonShadow = [196, 197]

export enum ColosseumOrXD {
  Colosseum,
  XD,
  NotDeterminable,
}

export const colosseumOrXD = (dexNum?: number, hasNationalRibbon?: boolean): ColosseumOrXD => {
  if (dexNum === undefined || hasNationalRibbon === undefined) {
    return ColosseumOrXD.NotDeterminable
  }
  if (hasNationalRibbon) {
    if (ColosseumOnlyShadow.includes(dexNum)) {
      return ColosseumOrXD.Colosseum
    }
    if (CXDShadow.includes(dexNum)) {
      return ColosseumOrXD.NotDeterminable
    }
    return ColosseumOrXD.XD
  }
  if (ColosseumOnlyNonShadow.includes(dexNum)) {
    return ColosseumOrXD.Colosseum
  }
  if (CXDNonShadow.includes(dexNum)) {
    return ColosseumOrXD.NotDeterminable
  }
  return ColosseumOrXD.XD
}
