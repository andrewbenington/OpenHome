import { GameOfOrigin } from "../consts/GameOfOrigin";
import { MONS_LIST } from "../consts/Mons";
import { pkm } from "../pkm/pkm";
import { getPokemonDBSprite, getSerebiiSprite, getShowdownSprite, getUnownSprite } from "./PokemonSprite";

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

const bytesToNumberLittleEndian = (bytes: Uint8Array) => {
  return bytesToNumberBigEndian(bytes.reverse());
};

const bytesToNumberBigEndian = (bytes: Uint8Array) => {
  let value = 0;
  bytes.forEach((byte) => {
    value *= 256;
    value += byte;
  });
  return value;
};

export const bytesToUint16LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 2));
};

export const bytesToUint32LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 4));
};

export const bytesToUint16BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 2));
};

export const bytesToUint24BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 3));
};

export const bytesToUint32BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 4));
};

export const uint16ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    value & 0xff,
    (value >> 8) & 0xff,
  ]);
};

export const uint32ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff,
  ]);
};

export const getItemSprite = (item: string) => {
  if (
    item.includes("Berry") &&
    (!item.includes(" ") || item.includes("Gold"))
  ) {
    return "https://archives.bulbagarden.net/media/upload/3/3c/GSC_Berry_Tree.png";
  } else if (
    item?.toLocaleLowerCase()?.replaceAll(" ", "-")?.includes("tiny-mushroom")
  ) {
    return `https://raw.githubusercontent.com/msikma/pokesprite/master/items-outline/valuable-item/${item
      ?.toLocaleLowerCase()
      ?.replaceAll(" ", "-")}.png`;
  }
  if (item?.toLocaleLowerCase()?.replaceAll(" ", "-")?.includes("bottle-cap")) {
    return `https://raw.githubusercontent.com/msikma/pokesprite/master/items-outline/other-item/${item
      ?.toLocaleLowerCase()
      ?.replaceAll(" ", "-")}.png`;
  }
  if (
    item?.toLocaleLowerCase()?.replaceAll(" ", "-")?.includes("rusted") ||
    item?.toLocaleLowerCase()?.replaceAll(" ", "-")?.includes("leek")
  ) {
    return `https://raw.githubusercontent.com/msikma/pokesprite/master/items-outline/hold-item/${item
      ?.toLocaleLowerCase()
      ?.replaceAll(" ", "-")
      ?.replace("leek", "stick")}.png`;
  }
  if (
    item?.toLocaleLowerCase()?.replaceAll(" ", "")?.includes("ragecandybar")
  ) {
    return `https://play.pokemonshowdown.com/sprites/itemicons/${item
      ?.toLocaleLowerCase()
      ?.replaceAll(" ", "")}.png`;
  }
  return `https://play.pokemonshowdown.com/sprites/itemicons/${item
    ?.toLocaleLowerCase()
    ?.replaceAll(" ", "-")}.png`;
};

export const getMonSprite = (mon: pkm, format: string) => {
  let formeName =
    (mon.formNum > 0 && mon.dexNum !== 664 && mon.dexNum !== 665
      ? MONS_LIST[mon.dexNum]?.formes[mon.formNum]?.formeName?.toLowerCase()
      : MONS_LIST[mon.dexNum]?.name?.toLowerCase()?.replaceAll("-", "")) ?? "";
  formeName = formeName
    .replaceAll("é", "e")
    .replaceAll("'", "")
    .replace("-own-tempo", "")
    .replace("-core", "")
    .replace(":", "");
  if (formeName.includes("nidoran")) {
    formeName = MONS_LIST[mon.dexNum].name.toLocaleLowerCase();
  }
  let formeParts = formeName.split("-");
  formeName = formeParts[0];
  if (formeParts.length > 1) {
    formeName += "-" + formeParts.slice(1).join("");
  }
  if (format === "pk2") {
    return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, "gen2");
  } else if (format === "xdpkm" || format === "colopkm") {
    return `https://www.pokencyclopedia.info/sprites/spin-off/ani_xd${
      mon.isShiny ? "_shiny" : ""
    }/ani_xd${mon.isShiny ? "-S" : ""}_${mon.dexNum
      .toString()
      .padStart(3, "0")}.gif`;
  } else if (format === "pk3" || format === "colopkm") {
    if (mon.dexNum === 201) {
      return getUnownSprite(mon.formNum, 3)
    }
    return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, "gen3");
  } else if (format === "pk4") {
    return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, "gen4");
  } else if (format === "pk5") {
    return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, "gen5ani");
  } else if (format === "pk6") { 
    return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, "gen6");
  } else if (format === "pk7") {
    if (alolaDex.includes(mon.dexNum)) {
      return getPokemonDBSprite(
        mon.dexNum,
        mon.formNum,
        mon.isShiny,
        "ultra-sun-ultra-moon"
      );
    } else {
      return getPokemonDBSprite(mon.dexNum, mon.formNum, mon.isShiny, "home");
    }
  } else if (format === "pb7") {
    if (mon.formNum !== 0 && (mon.dexNum === 25 || mon.dexNum === 133)) {
      return getShowdownSprite(mon.dexNum, mon.formNum, mon.isShiny, "ani");
    }
    return getPokemonDBSprite(mon.dexNum, mon.formNum, mon.isShiny, "go");
  } else if (format === "pa8") {
    return getPokemonDBSprite(
      mon.dexNum,
      mon.formNum,
      mon.isShiny,
      "legends-arceus"
    );
  } else if (format === "pk8" || format === "pb8") {
    return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, "SWSH");
  } else if (
    mon.dexNum <= 898 &&
    !formeName.includes("-hisui") &&
    !formeName.includes("-paldea")
  ) {
    return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, "SV");
  } else {
    if (mon.dexNum > 964 || formeName.includes("-paldea")) {
      return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, "SV");
    } else {
      return getSerebiiSprite(mon.dexNum, mon.formNum, mon.isShiny, "SV");
    }
  }
};

export const getGameLogo = (
  gameOfOrigin: number,
  dexNum?: number,
  hasNationalRibbon?: boolean
) => {
  if (gameOfOrigin === 0x0f) {
    if (dexNum === undefined || hasNationalRibbon === undefined) {
      return process.env.PUBLIC_URL + `/logos/ColosseumXD.png`;
    } else if (hasNationalRibbon) {
      if (ColosseumOnlyShadow.includes(dexNum)) {
        return process.env.PUBLIC_URL + `/logos/Colosseum.png`;
      } else if (CXDShadow.includes(dexNum)) {
        return process.env.PUBLIC_URL + `/logos/ColosseumXD.png`;
      } else {
        return process.env.PUBLIC_URL + `/logos/XD.png`;
      }
    } else {
      if (ColosseumOnlyNonShadow.includes(dexNum)) {
        return process.env.PUBLIC_URL + `/logos/Colosseum.png`;
      } else if (CXDNonShadow.includes(dexNum)) {
        return process.env.PUBLIC_URL + `/logos/ColosseumXD.png`;
      } else {
        return process.env.PUBLIC_URL + `/logos/XD.png`;
      }
    }
  } else if (gameOfOrigin === -1) {
    return process.env.PUBLIC_URL + `/logos/GB.png`;
  } else {
    return (
      process.env.PUBLIC_URL +
      `/logos/${
        GameOfOrigin[gameOfOrigin]?.logo ??
        GameOfOrigin[gameOfOrigin]?.name.split(" ").join("_")
      }.png`
    );
  }
};

// const getMoves = async () => {
//   let moves: any = {};
//   let promises = [];
//   for (let i = 1; i < 901; i++) {
//     let p = fetch(`https://pokeapi.co/api/v2/move/${i}`)
//       .then((response) => response.json())
//       .then((move) => {
//         let modifiedMove = {
//           name: move.names.find((name: any) => name.language.name === "en")
//             ?.name,
//           accuracy: move.accuracy,
//           class: move.damage_class.name,
//           generation: move.generation.name,
//           power: move.power,
//           pp: move.pp,
//           type: move.type.name,
//           id: move.id,
//         };
//         moves[move.id] = modifiedMove;
//       });
//     promises.push(p);
//   }
//   for (let i = 10001; i < 10019; i++) {
//     let p = fetch(`https://pokeapi.co/api/v2/move/${i}`)
//       .then((response) => response.json())
//       .then((move) => {
//         let modifiedMove = {
//           name: move.names.find((name: any) => name.language.name === "en")
//             ?.name,
//           accuracy: move.accuracy,
//           class: move.damage_class.name,
//           generation: move.generation.name,
//           power: move.power,
//           pp: move.pp,
//           type: move.type.name,
//           id: move.id,
//         };
//         moves[move.id] = modifiedMove;
//       });
//     promises.push(p);
//   }
//   Promise.all(promises).then(() =>
//     window.sessionStorage.setItem("moves", JSON.stringify(moves))
//   );
// };

export const getTypeColor = (type: string) => {
  switch (type) {
    case "normal":
      return "#A8A878";
    case "fire":
      return "#F08030";
    case "fighting":
      return "#C03028";
    case "water":
      return "#6890F0";
    case "flying":
      return "#A890F0";
    case "grass":
      return "#78C850";
    case "poison":
      return "#A040A0";
    case "electric":
      return "#F8D030";
    case "ground":
      return "#E0C068";
    case "psychic":
      return "#F85888";
    case "rock":
      return "#B8A038";
    case "ice":
      return "#98D8D8";
    case "bug":
      return "#A8B820";
    case "dragon":
      return "#7038F8";
    case "ghost":
      return "#705898";
    case "dark":
      return "#705848";
    case "steel":
      return "#B8B8D0";
    case "fairy":
      return "#EE99AC";
    case "shadow":
      return "#604E82";
    default:
      return "#555";
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


export function gen3ToNational(value: number) {
  return value < gen3IDs.length ? gen3IDs[value] : 0;
}

export const gen3IDs = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
  79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97,
  98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
  114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128,
  129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143,
  144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158,
  159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
  174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188,
  189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203,
  204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218,
  219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233,
  234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248,
  249, 250, 251, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264,
  265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 290, 291, 292, 276,
  277, 285, 286, 327, 278, 279, 283, 284, 320, 321, 300, 301, 352, 343, 344,
  299, 324, 302, 339, 340, 370, 341, 342, 349, 350, 318, 319, 328, 329, 330,
  296, 297, 309, 310, 322, 323, 363, 364, 365, 331, 332, 361, 362, 337, 338,
  298, 325, 326, 311, 312, 303, 307, 308, 333, 334, 360, 355, 356, 315, 287,
  288, 289, 316, 317, 357, 293, 294, 295, 366, 367, 368, 359, 353, 354, 336,
  335, 369, 304, 305, 306, 351, 313, 314, 345, 346, 347, 348, 280, 281, 282,
  371, 372, 373, 374, 375, 376, 377, 378, 379, 382, 383, 384, 380, 381, 385,
  386, 358,
];