import { Generation, OriginGame, OriginGameWithData } from '@pkm-rs/pkg'

export const GameLogos: { [key: string]: string } = {
  AlphaSapphire: `logos/Alpha_Sapphire.png`,
  Black2: `logos/Black_2.png`,
  Black: `logos/Black.png`,
  BlueGreen: `logos/Blue_Green.png`,
  BlueJP: `logos/Blue_JP.png`,
  BrilliantDiamond: `logos/Brilliant_Diamond.png`,
  Colosseum: `logos/Colosseum.png`,
  ColosseumXD: `logos/ColosseumXD.png`,
  Crystal: `logos/Crystal.png`,
  Diamond: `logos/Diamond.png`,
  Emerald: `logos/Emerald.png`,
  FireRed: `logos/FireRed.png`,
  GB: `logos/GB.png`,
  GO: `logos/GO.png`,
  Gold: `logos/Gold.png`,
  HeartGold: `logos/HeartGold.png`,
  LeafGreen: `logos/LeafGreen.png`,
  LegendsArceus: `logos/Legends_Arceus.png`,
  LetsGoEevee: `logos/Lets_Go_Eevee.png`,
  LetsGoPikachu: `logos/Lets_Go_Pikachu.png`,
  Moon: `logos/Moon.png`,
  OmegaRuby: `logos/Omega_Ruby.png`,
  Pearl: `logos/Pearl.png`,
  Platinum: `logos/Platinum.png`,
  Red: `logos/Red.png`,
  Ruby: `logos/Ruby.png`,
  Sapphire: `logos/Sapphire.png`,
  Scarlet: `logos/Scarlet.png`,
  Shield: `logos/Shield.png`,
  ShiningPearl: `logos/Shining_Pearl.png`,
  Silver: `logos/Silver.png`,
  SoulSilver: `logos/SoulSilver.png`,
  Sun: `logos/Sun.png`,
  Sword: `logos/Sword.png`,
  UltraMoon: `logos/Ultra_Moon.png`,
  UltraSun: `logos/Ultra_Sun.png`,
  Violet: `logos/Violet.png`,
  White2: `logos/White_2.png`,
  White: `logos/White.png`,
  X: `logos/X.png`,
  XD: `logos/XD.png`,
  Y: `logos/Y.png`,
  Yellow: `logos/Yellow.png`,
}

export const getOriginMark = (originMark: string) => {
  return `origin_marks/${originMark}.png`
}

export function getOriginIconPath(origin: OriginGameWithData) {
  return origin.generation === Generation.G4 || origin.generation === Generation.G5
    ? '/icons/ds.png'
    : origin.game === OriginGame.ColosseumXd
      ? '/icons/gcn.png'
      : origin.generation === Generation.G3
        ? '/icons/gba.png'
        : origin.mark
          ? `/origin_marks/${origin.mark}.png`
          : undefined
}
