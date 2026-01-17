import { Item } from '@pkm-rs/pkg'

const BallIcons: { [key: string]: string } = {
  Master: 'items/index/0001.png',
  Ultra: 'items/index/0002.png',
  Great: 'items/index/0003.png',
  Poke: 'items/index/0004.png',
  Safari: 'items/index/0005.png',
  Net: 'items/index/0006.png',
  Dive: 'items/index/0007.png',
  Nest: 'items/index/0008.png',
  Repeat: 'items/index/0009.png',
  Timer: 'items/index/0010.png',
  Luxury: 'items/index/0011.png',
  Premier: 'items/index/0012.png',
  Dusk: 'items/index/0013.png',
  Heal: 'items/index/0014.png',
  Quick: 'items/index/0015.png',
  Cherish: 'items/index/0016.png',
  Fast: 'items/index/0492.png',
  Level: 'items/index/0493.png',
  Lure: 'items/index/0494.png',
  Heavy: 'items/index/0495.png',
  Love: 'items/index/0496.png',
  Friend: 'items/index/0497.png',
  Moon: 'items/index/0498.png',
  Sport: 'items/index/0499.png',
  Dream: 'items/index/0576.png',
  Beast: 'items/index/0851.png',
  Strange: 'items/index/1785.png',
  PokeLA: 'items/index/1710.png',
  GreatLA: 'items/index/1711.png',
  UltraLA: 'items/index/1712.png',
  Feather: 'items/index/1713.png',
  Wing: 'items/index/1746.png',
  Jet: 'items/index/1747.png',
  HeavyLA: 'items/index/1748.png',
  Leaden: 'items/index/1749.png',
  Gigaton: 'items/index/1750.png',
  Origin: 'items/index/1771.png',
}

export const BallsImageList = [
  '',
  BallIcons.Master,
  BallIcons.Ultra,
  BallIcons.Great,
  BallIcons.Poke,
  BallIcons.Safari,
  BallIcons.Net,
  BallIcons.Dive,
  BallIcons.Nest,
  BallIcons.Repeat,
  BallIcons.Timer,
  BallIcons.Luxury,
  BallIcons.Premier,
  BallIcons.Dusk,
  BallIcons.Heal,
  BallIcons.Quick,
  BallIcons.Cherish,
  BallIcons.Fast,
  BallIcons.Level,
  BallIcons.Lure,
  BallIcons.Heavy,
  BallIcons.Love,
  BallIcons.Friend,
  BallIcons.Moon,
  BallIcons.Sport,
  BallIcons.Dream,
  BallIcons.Beast,
  BallIcons.Strange,
  BallIcons.PokeLA,
  BallIcons.GreatLA,
  BallIcons.UltraLA,
  BallIcons.Feather,
  BallIcons.Wing,
  BallIcons.Jet,
  BallIcons.HeavyLA,
  BallIcons.Leaden,
  BallIcons.Gigaton,
  BallIcons.Origin,
]

const SharedItemSpritePrefixes = ['Data Card', 'Lost Satchel', 'Old Verse', 'Lost Satchel']

export const getItemIconPath = (item: number): string => {
  if (
    (item > 1057 && item < 1074) ||
    (item > 1639 && item < 1651) ||
    (item > 1651 && item < 1678) ||
    (item > 1786 && item < 1808) ||
    (item > 1843 && item < 1857) ||
    (item > 1946 && item < 2160) ||
    (item > 2231 && item < 2344) ||
    (item > 2345 && item < 2401) ||
    (item > 2416 && item < 2479) ||
    (item > 2483 && item < 2522)
  ) {
    return `items/index/0000.png`
  }

  const PICNIC_SET = 2311
  const BLUE_POKE_BALL_PICK = 2342
  const PINK_BOTTLE = 2348
  const YELLOW_DISH = 2400

  const itemName = Item.fromIndex(item)?.name ?? 'None'
  if (item > 0) {
    if (itemName.startsWith('HM') || (itemName.startsWith('TM') && itemName.charAt(2) !== 'V')) {
      return 'items/tm/normal.png'
    }
    if (itemName.startsWith('TR')) {
      return 'items/tr/normal.png'
    }
    if (itemName.startsWith('★')) {
      return 'items/shared/dynamax-crystal.png'
    }
    if (
      (item >= PICNIC_SET && item <= BLUE_POKE_BALL_PICK) ||
      (item >= PINK_BOTTLE && item <= YELLOW_DISH)
    ) {
      return 'items/shared/picnic-set.png'
    }
    for (let i = 0; i < SharedItemSpritePrefixes.length; i++) {
      const prefix = SharedItemSpritePrefixes[i]

      if (itemName.startsWith(prefix)) {
        return `items/shared/${prefix.toLocaleLowerCase().replaceAll(' ', '-')}`
      }
    }
    return `items/index/${item.toString().padStart(4, '0')}.png`
  }
  return `items/index/0000.png`
}

export const getBallIconPath = (ball: number): string => {
  return BallsImageList[ball]
}
