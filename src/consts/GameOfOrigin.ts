import { Origin } from '../types/types';

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
  { name: 'White' },
  { name: 'Black' },
  { name: 'White 2' },
  { name: 'Black 2' },
  { name: 'X', mark: 'G6' },
  { name: 'Y', mark: 'G6' },
  { name: 'Alpha Sapphire', mark: 'G6' },
  { name: 'Omega Ruby', mark: 'G6' },
  null,
  null,
  { name: 'Sun', mark: 'Alola' },
  { name: 'Moon', mark: 'Alola' },
  { name: 'Ultra Sun', mark: 'Alola' },
  { name: 'Ultra Moon', mark: 'Alola' },
  { name: 'GO', mark: 'GO' },
  { name: 'Red', mark: 'GB' },
  { name: 'Blue/Green', mark: 'GB', logo: 'Blue_Green' },
  { name: 'Blue (Japan)', mark: 'GB', logo: 'Blue_JP' },
  { name: 'Yellow', mark: 'GB' },
  { name: 'Gold', mark: 'GB' },
  { name: 'Silver', mark: 'GB' },
  { name: 'Crystal', mark: 'GB' },
  { name: "Let's Go, Pikachu!", mark: 'LGPE', logo: "Let's_Go_Pikachu" },
  { name: "Let's Go, Eevee!", mark: 'LGPE', logo: "Let's_Go_Eevee" },
  { name: 'Sword', mark: 'Galar' },
  { name: 'Shield', mark: 'Galar' },
  null,
  { name: 'Legends: Arceus', mark: 'LA', logo: 'Legends_Arceus' },
  { name: 'Brilliant Diamond', mark: 'BDSP' },
  { name: 'Shining Pearl', mark: 'BDSP' },
  { name: 'Scarlet', mark: 'Tera' },
  { name: 'Violet', mark: 'Tera' },
];

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
];

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

export const isKanto = (origin: GameOfOrigin) => {
  return (
    origin === GameOfOrigin.Red ||
    origin === GameOfOrigin.BlueGreen ||
    origin === GameOfOrigin.BlueJapan ||
    origin === GameOfOrigin.Yellow ||
    origin === GameOfOrigin.FireRed ||
    origin === GameOfOrigin.LeafGreen ||
    origin === GameOfOrigin.LetsGoPikachu ||
    origin === GameOfOrigin.LetsGoEevee
  );
};

export const isHoenn = (origin: GameOfOrigin) => {
  return (
    origin === GameOfOrigin.Sapphire ||
    origin === GameOfOrigin.Ruby ||
    origin === GameOfOrigin.Emerald ||
    origin === GameOfOrigin.AlphaSapphire ||
    origin === GameOfOrigin.OmegaRuby
  );
};

export const isSinnoh = (origin: GameOfOrigin) => {
  return (
    origin === GameOfOrigin.Diamond ||
    origin === GameOfOrigin.Pearl ||
    origin === GameOfOrigin.Platinum ||
    origin === GameOfOrigin.BrilliantDiamond ||
    origin === GameOfOrigin.ShiningPearl
  );
};

export const gameOfOriginFromFormat = (format: string) => {
  let game;
  switch (format) {
    case 'PK2':
      game = GameOfOrigin.Crystal;
      break;
    case 'PK3':
      game = GameOfOrigin.Sapphire;
      break;
    case 'PK4':
      game = GameOfOrigin.SoulSilver;
      break;
    case 'PK5':
      game = GameOfOrigin.White2;
      break;
    case 'PK6':
      game = GameOfOrigin.OmegaRuby;
      break;
    case 'PK7':
      game = GameOfOrigin.Moon;
      break;
    case 'PB7':
      game = GameOfOrigin.LetsGoEevee;
      break;
    case 'PK8':
      game = GameOfOrigin.Shield;
      break;
    case 'PA8':
      game = GameOfOrigin.LegendsArceus;
      break;
    case 'PB8':
      game = GameOfOrigin.BrilliantDiamond;
      break;
    case 'PK9':
      game = GameOfOrigin.Scarlet;
      break;
  }
  return game;
};
