import { GameOfOrigin } from "../consts/GameOfOrigin";
import { MONS_LIST } from "../consts/Mons";
import { NationalDex } from "../consts/NationalDex";
import { pokemon, Stat } from "../types/types";
import { getNatureSummary } from "../consts/Natures";

const ColosseumOnlyNonShadow = [311];

const ColosseumOnlyShadow = [
  153, 154, 156, 157, 159, 160, 162, 164, 176, 468, 185, 188, 189, 190, 192,
  193, 195, 198, 200, 206, 207, 210, 211, 213, 214, 215, 218, 223, 461, 472,
  469, 430, 429, 982, 223, 224, 225, 226, 227, 228, 234, 899, 235, 237, 241,
  243, 244, 245, 248, 250, 307, 308, 329, 330, 333, 357, 359, 376,
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

export const bytesToUint32BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 4));
};

export const getItemSprite = (item: string) => {
  if (
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

export const getMonSprite = (mon: pokemon, format: string) => {
  let formeName =
    (mon.formNum > 0 && mon.dexNum !== 664 && mon.dexNum !== 665
      ? MONS_LIST[mon.dexNum]?.formes[mon.formNum]?.formeName?.toLowerCase()
      : MONS_LIST[mon.dexNum]?.name?.toLowerCase()?.replaceAll("-", "")) ?? "";
  formeName = formeName
    .replaceAll("é", "e")
    .replaceAll("'", "")
    .replaceAll(".", "")
    .replaceAll(" ", "")
    .replace("-own-tempo", "")
    .replace("-core", "")
    .replace(":", "");
  let formeParts = formeName.split("-");
  formeName = formeParts[0];
  if (formeParts.length > 1) {
    formeName += "-" + formeParts.slice(1).join("");
  }
  if (format === "xdpkm" || format === "colopkm") {
    return `https://www.pokencyclopedia.info/sprites/spin-off/ani_xd${
      mon.isShiny ? "_shiny" : ""
    }/ani_xd${mon.isShiny ? "-S" : ""}_${mon.dexNum
      .toString()
      .padStart(3, "0")}.gif`;
  } else if (format === "pk3" || format === "colopkm") {
    return `https://play.pokemonshowdown.com/sprites/${`gen3${
      mon.isShiny ? "-shiny" : ""
    }`}/${formeName}.png`;
  } else if (format === "pk4") {
    return `https://play.pokemonshowdown.com/sprites/${`gen4${
      mon.isShiny ? "-shiny" : ""
    }`}/${formeName}.png`;
  } else if (
    mon.dexNum <= 898 &&
    !formeName.includes("-hisui") &&
    !formeName.includes("-paldea")
  ) {
    return `https://play.pokemonshowdown.com/sprites/${
      format === "pk5"
        ? `gen5ani${mon.isShiny ? "-shiny" : ""}`
        : `ani${mon.isShiny ? "-shiny" : ""}`
    }/${formeName}.gif`;
  } else {
    return `https://play.pokemonshowdown.com/sprites/${`gen5${
      mon.isShiny ? "-shiny" : ""
    }`}/${formeName}.png`;
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

const getMoves = async () => {
  let moves: any = {};
  let promises = [];
  for (let i = 1; i < 901; i++) {
    let p = fetch(`https://pokeapi.co/api/v2/move/${i}`)
      .then((response) => response.json())
      .then((move) => {
        let modifiedMove = {
          name: move.names.find((name: any) => name.language.name === "en")
            ?.name,
          accuracy: move.accuracy,
          class: move.damage_class.name,
          generation: move.generation.name,
          power: move.power,
          pp: move.pp,
          type: move.type.name,
          id: move.id,
        };
        moves[move.id] = modifiedMove;
      });
    promises.push(p);
  }
  for (let i = 10001; i < 10019; i++) {
    let p = fetch(`https://pokeapi.co/api/v2/move/${i}`)
      .then((response) => response.json())
      .then((move) => {
        let modifiedMove = {
          name: move.names.find((name: any) => name.language.name === "en")
            ?.name,
          accuracy: move.accuracy,
          class: move.damage_class.name,
          generation: move.generation.name,
          power: move.power,
          pp: move.pp,
          type: move.type.name,
          id: move.id,
        };
        moves[move.id] = modifiedMove;
      });
    promises.push(p);
  }
  Promise.all(promises).then(() =>
    window.sessionStorage.setItem("moves", JSON.stringify(moves))
  );
};

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

const getStatGen3Onward = (
  stat: Stat,
  dexNum: number,
  formNum: number,
  iv: number,
  ev: number,
  level: number,
  nature: number
) => {
  const natureSummary = getNatureSummary(nature);
  const natureMultiplier = natureSummary?.includes(`+${stat}`)
    ? 1.1
    : natureSummary?.includes(`-${stat}`)
    ? 0.9
    : 1;
  const baseStats = MONS_LIST[dexNum]?.formes[formNum]?.baseStats;
  if (baseStats) {
    const baseStat = (baseStats as any)[stat.toLowerCase()];
    return Math.floor(
      natureMultiplier *
        (Math.floor((level * (2 * baseStat + iv + Math.floor(ev / 4))) / 100) +
          5)
    );
  } else {
    return 0;
  }
};

const getHPGen3Onward = (
  dexNum: number,
  formNum: number,
  iv: number,
  ev: number,
  level: number
) => {
  if (dexNum === 292) {
    // shedinja
    return 1;
  }
  const baseHP = MONS_LIST[dexNum]?.formes[formNum]?.baseStats?.hp;
  if (baseHP) {
    return (
      Math.floor((level * (2 * baseHP + iv + Math.floor(ev / 4))) / 100) +
      level +
      10
    );
  } else {
    return 0;
  }
};
