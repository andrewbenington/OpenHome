import { ColosseumOrXD, GameOfOrigin, GameOfOriginData, colosseumOrXD } from 'pokemon-resources'

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
  LetsGoEevee: `logos/Let's_Go_Eevee.png`,
  LetsGoPikachu: `logos/Let's_Go_Pikachu.png`,
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

export const getGameLogo = (
  gameOfOrigin: number,
  extraData?: { pluginIdentifier?: string; dexNum?: number; hasNationalRibbon?: boolean }
) => {
  if (gameOfOrigin === GameOfOrigin.ColosseumXD) {
    switch (colosseumOrXD(extraData?.dexNum, extraData?.hasNationalRibbon)) {
      case ColosseumOrXD.Colosseum:
        return GameLogos.Colosseum
      case ColosseumOrXD.XD:
        return GameLogos.XD
      case ColosseumOrXD.NotDeterminable:
        return GameLogos.ColosseumXD
    }
  }
  if (gameOfOrigin === -1) {
    return GameLogos.GB
  }
  return GameLogos[
    GameOfOriginData[gameOfOrigin]?.logo ??
      GameOfOriginData[gameOfOrigin]?.name.replace(' ', '') ??
      ''
  ]
}

export const getOriginMark = (originMark: string) => {
  return `origin_marks/${originMark}.png`
}

export const getRelevantGameLogos = (saveTypeName: string): string[] => {
  const gameNames = saveTypeName.split('/').map((name) => name.trim())
  const logos = gameNames.map((gameName) => {
    const logoKey = gameName.replace(' ', '')
    return GameLogos[logoKey] ?? null
  })
  console.log(logos.filter((logo): logo is string => logo !== null))
  return logos.filter((logo): logo is string => logo !== null)
}
