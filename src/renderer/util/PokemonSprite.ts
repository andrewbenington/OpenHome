import { Items } from 'consts';
import { GameOfOriginData } from 'consts/GameOfOrigin';
import { POKEMON_DATA } from 'consts/Mons';
import { PKM } from '../../types/PKMTypes/PKM';
import { GameLogos } from '../images/Images';
const ColosseumOnlyNonShadow = [311];

const ColosseumOnlyShadow = [
  153, 154, 156, 157, 159, 160, 162, 164, 176, 468, 185, 188, 189, 190, 192,
  193, 195, 198, 200, 206, 207, 210, 211, 213, 214, 215, 218, 223, 461, 472,
  469, 430, 429, 982, 223, 224, 225, 226, 227, 234, 899, 235, 237, 241, 243,
  244, 245, 248, 250, 307, 308, 329, 330, 333, 357, 359, 376,
];

const CXDShadow = [
  166, 168, 180, 181, 196, 197, 205, 217, 219, 221, 473, 901, 229, 296, 297,
  334,
];

const CXDNonShadow = [196, 197];

export const getShowdownSprite = (
  dexNum: number,
  formNum: number,
  isShiny: boolean,
  game: string
) => {
  if (dexNum < 1 || dexNum > 1010) {
    return '';
  }
  let formeName =
    (formNum > 0 && dexNum !== 664 && dexNum !== 665
      ? POKEMON_DATA[dexNum]?.formes[formNum]?.formeName?.toLowerCase()
      : POKEMON_DATA[dexNum]?.name?.toLowerCase()?.replaceAll('-', '')) ?? '';
  let formeNameSegments = formeName.split('-');
  if (formeNameSegments.length === 1) {
    formeName = formeNameSegments[0];
  } else {
    formeName = `${formeNameSegments[0]}-${formeNameSegments
      .slice(1)
      .join('')}`;
  }
  formeName = formeName
    .replaceAll('é', 'e')
    .replaceAll("'", '')
    .replace('-own-tempo', '')
    .replace('-core', '')
    .replace('.', '')
    .replace(' ', '')
    .replace(':', '');
  return `https://play.pokemonshowdown.com/sprites/${game}${
    isShiny ? '-shiny' : ''
  }/${formeName}.${game.includes('ani') ? 'gif' : 'png'}`;
};

const formatPokemonDBForme = (dexNum: number, formNum: number) => {
  if (dexNum < 1 || dexNum > 1010) {
    return '';
  }
  let formeName =
    (dexNum !== 664 && dexNum !== 665
      ? POKEMON_DATA[dexNum]?.formes[formNum]?.formeName?.toLowerCase()
      : POKEMON_DATA[dexNum]?.name?.toLowerCase()) ?? '';
  formeName = formeName
    .replaceAll('é', 'e')
    .replaceAll("'", '')
    .replace('-own-tempo', '')
    .replace(':', '')
    .replace('. ', '-')
    .replace(' ', '-')
    .replace('.', '')
    .replace('alola', 'alolan')
    .replace('galar', 'galarian')
    .replace('hisui', 'hisuian')
    .replace('paldea', 'paldean')
    .replace('-natural', '')
    .replace('-disguised', '')
    .replace('-partner', '-johto')
    .replace('-exclamation', '-em')
    .replace('-question', '-qm');
  if (dexNum === 25 && formNum > 0 && formNum != 8) {
    formeName += '-cap';
  }
  if (!formeName.includes('nidoran')) {
    formeName = formeName.replace(/-f$/, '-female').replace(/-m$/, '-male');
  }
  if (formeName.includes('-core')) {
    formeName = `${formeName.split('-core').join('')}-core`;
  }
  return formeName;
};

export const getPokemonDBArt = (dexNum: number, formNum: number) => {
  const formeName = formatPokemonDBForme(dexNum, formNum);
  return `https://img.pokemondb.net/artwork/large/${formeName}.jpg`;
};

export const getPokemonDBSprite = (
  dexNum: number,
  formNum: number,
  isShiny: boolean,
  game: string
) => {
  const formeName = formatPokemonDBForme(dexNum, formNum);
  return `https://img.pokemondb.net/sprites/${game}/${
    isShiny ? 'shiny' : 'normal'
  }/${formeName}.png`;
};

export const getSerebiiSprite = (
  dexNum: number,
  formNum: number,
  isShiny: boolean,
  game: string
) => {
  if (dexNum < 1 || dexNum > 1010) {
    return '';
  }
  let formeName: string | undefined =
    dexNum !== 664 && dexNum !== 665
      ? POKEMON_DATA[dexNum]?.formes[formNum]?.sprite
      : POKEMON_DATA[dexNum]?.name?.toLowerCase();
  formeName = formeName
    ?.replace('paldeafire', 'b')
    ?.replace('paldeawater', 'a');
  let monName = POKEMON_DATA[dexNum].formes[0].sprite;
  if (formNum === 0) {
    formeName = undefined;
  } else {
    let formeSections = formeName.split(`${monName}-`);
    if (formeSections.length > 1) {
      formeName = formeSections[1].charAt(0);
    } else {
      formeName = undefined;
    }
  }
  if (dexNum === 741 && formNum === 2) {
    formeName = 'pau';
  }
  let gameURI = game;
  if (!isShiny) {
    gameURI = serebiiInitialsToGame[game];
  }
  return `https://www.serebii.net/${isShiny ? 'Shiny/' : ''}${gameURI}/${
    isShiny ? '' : 'pokemon/new/'
  }${dexNum.toString().padStart(3, '0')}${
    formeName ? `-${formeName}` : ''
  }.png`;
};

export const getUnownSprite = (formNum: number, gen: number) => {
  let form = String.fromCharCode(97 + formNum);
  if (form === '|') {
    form = '-question';
  } else if (form === '{') {
    form = '-exclamation';
  }
  if (gen === 3) {
    return `https://www.pokencyclopedia.info/sprites/gen3/spr_ruby-sapphire/spr_rs_201-${form}.png`;
  }
};

const serebiiInitialsToGame: { [key: string]: string } = {
  SWSH: 'swordshield',
  SV: 'scarletviolet',
};

export const getItemSprite = (item: string) => {
  if (!item) return;
  if (item.includes('Berry') && !Items.includes(item)) {
    return 'https://archives.bulbagarden.net/media/upload/3/3c/GSC_Berry_Tree.png';
  } else {
    return `https://www.serebii.net/itemdex/sprites/${item
      .toLocaleLowerCase()
      .replaceAll(' ', '')}.png`;
  }
};

export const getMonSprite = (mon: PKM, format: string) => {
  let formeName =
    (mon.formNum > 0 && mon.dexNum !== 664 && mon.dexNum !== 665
      ? POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.formeName?.toLowerCase()
      : POKEMON_DATA[mon.dexNum]?.name?.toLowerCase()?.replaceAll('-', '')) ??
    '';
  formeName = formeName
    .replaceAll('é', 'e')
    .replaceAll("'", '')
    .replace('-own-tempo', '')
    .replace('-core', '')
    .replace(':', '');
  if (formeName.includes('nidoran')) {
    formeName = POKEMON_DATA[mon.dexNum].name.toLocaleLowerCase();
  }
  let formeParts = formeName.split('-');
  formeName = formeParts[0];
  if (formeParts.length > 1) {
    formeName += `-${formeParts.slice(1).join('')}`;
  }
  switch (format) {
    case 'OHPKM':
      if (mon.dexNum > 905) {
        return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, 'SV');
      }
      return getPokemonDBSprite(mon.dexNum, mon.formNum, mon.isShiny, 'home');
    case 'PK1':
      return getShowdownSprite(mon.dexNum, mon.formNum, false, 'gen1');
    case 'PK2':
      return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, 'gen2');
    case 'XDPKM':
    case 'COLOPKM':
      return `https://www.pokencyclopedia.info/sprites/spin-off/ani_xd${
        mon.isShiny ? '_shiny' : ''
      }/ani_xd${mon.isShiny ? '-S' : ''}_${mon.dexNum
        .toString()
        .padStart(3, '0')}.gif`;
    case 'PK3':
      if (mon.dexNum === 201) {
        return getUnownSprite(mon.formNum, 3);
      }
      return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, 'gen3');
    case 'PK4':
      return getPokemonDBSprite(
        mon.dexNum,
        mon.formNum,
        mon.isShiny,
        'heartgold-soulsilver'
      );
    case 'PK5':
      return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, 'gen5ani');
    case 'PK6':
      return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, 'ani');
    case 'PK7':
      if (alolaDex.includes(mon.dexNum)) {
        return getPokemonDBSprite(
          mon.dexNum,
          mon.formNum,
          mon.isShiny,
          'ultra-sun-ultra-moon'
        );
      } else {
        return getPokemonDBSprite(mon.dexNum, mon.formNum, mon.isShiny, 'home');
      }
    case 'PB7':
      return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, 'home');
    case 'PA8':
      return getPokemonDBSprite(
        mon.dexNum,
        mon.formNum,
        mon.isShiny,
        'legends-arceus'
      );
    case 'PK8':
    case 'PB8':
      return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, 'SWSH');
    case 'PK9':
      if (mon.formNum !== 0 && (mon.dexNum === 25 || mon.dexNum === 133)) {
        return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, 'ani');
      }
      return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, 'SV');
    default:
      return getPokemonDBArt(mon.dexNum, mon.formNum);
  }
};

export const getGameLogo = (
  gameOfOrigin: number,
  dexNum?: number,
  hasNationalRibbon?: boolean
) => {
  if (gameOfOrigin === 0x0f) {
    if (dexNum === undefined || hasNationalRibbon === undefined) {
      return GameLogos.ColosseumXD;
    } else if (hasNationalRibbon) {
      if (ColosseumOnlyShadow.includes(dexNum)) {
        return GameLogos.Colosseum;
      } else if (CXDShadow.includes(dexNum)) {
        return GameLogos.ColosseumXD;
      } else {
        return GameLogos.XD;
      }
    } else if (ColosseumOnlyNonShadow.includes(dexNum)) {
      return GameLogos.Colosseum;
    } else if (CXDNonShadow.includes(dexNum)) {
      return GameLogos.ColosseumXD;
    } else {
      return GameLogos.XD;
    }
  } else if (gameOfOrigin === -1) {
    return GameLogos.GB;
  } else {
    return GameLogos[
      GameOfOriginData[gameOfOrigin]?.logo ??
        GameOfOriginData[gameOfOrigin]?.name.replace(' ', '') ??
        ''
    ];
  }
};

const alolaDex = [
  10, 11, 12, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 35, 36, 37, 38, 39, 40,
  41, 42, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
  65, 66, 67, 68, 72, 73, 74, 75, 76, 79, 80, 81, 82, 86, 87, 88, 89, 90, 91,
  92, 93, 94, 96, 97, 102, 103, 104, 105, 108, 113, 115, 118, 119, 120, 121,
  122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136,
  137, 138, 139, 140, 141, 142, 143, 147, 148, 149, 163, 164, 165, 166, 167,
  168, 169, 170, 171, 172, 173, 174, 177, 178, 179, 180, 181, 185, 186, 190,
  196, 197, 198, 199, 200, 204, 205, 206, 209, 210, 212, 214, 215, 222, 223,
  224, 225, 226, 227, 228, 229, 233, 235, 238, 239, 240, 241, 242, 246, 247,
  248, 278, 279, 283, 284, 296, 297, 299, 302, 303, 309, 310, 318, 319, 320,
  321, 324, 327, 328, 329, 330, 339, 340, 341, 342, 343, 344, 345, 346, 347,
  348, 349, 350, 351, 352, 353, 354, 357, 359, 361, 362, 366, 367, 368, 369,
  370, 371, 372, 373, 374, 375, 376, 408, 409, 410, 411, 422, 423, 424, 425,
  426, 427, 428, 429, 430, 438, 439, 440, 443, 444, 445, 446, 447, 448, 456,
  457, 458, 461, 462, 463, 466, 467, 470, 471, 474, 476, 478, 506, 507, 508,
  524, 525, 526, 546, 547, 548, 549, 550, 551, 552, 553, 559, 560, 564, 565,
  566, 567, 568, 569, 570, 571, 572, 573, 582, 583, 584, 587, 592, 593, 594,
  605, 606, 619, 620, 621, 622, 623, 624, 625, 627, 628, 629, 630, 636, 637,
  661, 662, 663, 667, 668, 669, 670, 671, 674, 675, 676, 686, 687, 690, 691,
  692, 693, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708,
  709, 714, 715, 718, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732,
  733, 734, 735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747,
  748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762,
  763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777,
  778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792,
  793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807,
];

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'normal':
      return '#A8A878';
    case 'fire':
      return '#F08030';
    case 'fighting':
      return '#C03028';
    case 'water':
      return '#6890F0';
    case 'flying':
      return '#A890F0';
    case 'grass':
      return '#78C850';
    case 'poison':
      return '#A040A0';
    case 'electric':
      return '#F8D030';
    case 'ground':
      return '#E0C068';
    case 'psychic':
      return '#F85888';
    case 'rock':
      return '#B8A038';
    case 'ice':
      return '#98D8D8';
    case 'bug':
      return '#A8B820';
    case 'dragon':
      return '#7038F8';
    case 'ghost':
      return '#705898';
    case 'dark':
      return '#705848';
    case 'steel':
      return '#B8B8D0';
    case 'fairy':
      return '#EE99AC';
    case 'shadow':
      return '#604E82';
    default:
      return '#888';
  }
};
