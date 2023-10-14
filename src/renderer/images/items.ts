import { ItemGen2, ItemGen2ToString } from '../../resources/gen/items/Gen2'
import { ItemGen3, ItemGen3ToString } from '../../resources/gen/items/Gen3'
import {
  ItemToString,
  Item,
  ItemFromString,
} from '../../resources/gen/items/Items'

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

export const BallsList = [
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

const SharedItemSpritePrefixes = [
  'Data Card',
  'Lost Satchel',
  'Old Verse',
  'Lost Satchel',
]

const itemEquivalents = {
  'Parlyz Heal': 'Paralyze Heal',
  Bicycle: 'Bike',
  'Devon Goods': 'Devon Parts',
  Itemfinder: 'Dowsing Machine',
  'Pokéblock Case': 'Pokéblock Kit',
  NeverMeltIce: 'Never-Melt Ice',
  'Up-Grade': 'Upgrade',
  Stick: 'Leek',
  "Oak's Parcel": 'Parcel',
}

export const getItemIconPath = (
  item: Item | ItemGen3 | ItemGen2,
  format?: string
): string => {
  let itemName: string
  if (format === 'PK3' || format === 'COLOPKM' || format === 'XDPKM') {
    itemName = ItemGen3ToString(item as ItemGen3)
    if (itemName in itemEquivalents) {
      itemName = itemEquivalents[itemName]
    }
    item = ItemFromString(itemName)
  } else if (format === 'PK2') {
    itemName = ItemGen2ToString(item as ItemGen2)
    if (itemName in itemEquivalents) {
      itemName = itemEquivalents[itemName]
    }
    item = ItemFromString(itemName)
  } else {
    itemName = ItemToString(item as Item)
  }
  if (item > 0) {
    if (
      itemName.startsWith('HM') ||
      (itemName.startsWith('TM') && itemName.charAt(2) !== 'V')
    ) {
      return 'items/tm/normal.png'
    }
    if (itemName.startsWith('TR')) {
      return 'items/tr/normal.png'
    }
    if (itemName.startsWith('★')) {
      return 'items/shared/dynamax-crystal.png'
    }
    if (
      (item >= Item.PicnicSet && item <= Item.BluePokeBallPick) ||
      (item >= Item.PinkBottle && item <= Item.YellowDish)
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
  return BallsList[ball]
}
