import { MONS_LIST } from "../consts/Mons";
import { natDexToSV } from "./ConvertPokemonID";


export const getBoxSprite = (
  dexNum: number,
  formNum: number,
) => {
  let formeName =
    (dexNum !== 664 && dexNum !== 665 && formNum > 0
      ? MONS_LIST[dexNum]?.formes[formNum]?.formeName?.toLowerCase()
      : MONS_LIST[dexNum]?.name?.toLowerCase()) ?? "";
  formeName = formeName
    .replaceAll("é", "e")
    .replaceAll("'", "")
    .replace("-own-tempo", "")
    .replace(":", "")
    .replace(". ", "-")
    .replace(" ", "-")
    .replace(".", "")
    .replace("-natural", "")
    .replace("-disguised", "");
  if (!formeName.includes("nidoran") && dexNum !== 201) {
    formeName = formeName.replace(/-f$/, "-female").replace(/-m$/, "-male");
  }
  if (formeName.includes("-core")) {
    formeName = formeName.split("-core").join("") + "-core";
  }
  return `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/${formeName}.png`;
};

export const getBoxSprite1 = (dexNum: number, formNum: number) => {
  if (dexNum === 0) return;
  let defaultFormeIsNamed =
    MONS_LIST[dexNum].formes[0].name === MONS_LIST[dexNum].formes[0].formeName;
  let forme = MONS_LIST[dexNum].formes[formNum];
  if (forme === undefined) {
    return;
  }
  let regularForme =
    forme.isBaseForme || forme.regional
      ? "00"
      : !defaultFormeIsNamed
      ? `${formNum}`.padStart(2, "0")
      : `${formNum + 1}`.padStart(2, "0");
  let regionalForme;
  let region =
    forme.regional ??
    (forme.prevo &&
      MONS_LIST[forme.prevo.dexNumber].formes[forme.prevo.formeNumber]
        .regional);
  switch (region) {
    case "Alola":
      regionalForme = "11";
      break;
    case "Galar":
      regionalForme = "31";
      break;
    case "Hisui":
      regionalForme = "41";
      break;
    case "Paldea":
      regionalForme = "51";
      break;
    default:
      regionalForme = "00";
  }
  return `./box_icons/pm${dexNum
    .toString()
    .padStart(4, "0")}_${regularForme}_${regionalForme}_00.png`;
};

export const getShowdownSprite = (
  dexNum: number,
  formNum: number,
  isShiny: boolean,
  game: string
) => {
  let formeName =
    (formNum > 0 && dexNum !== 664 && dexNum !== 665
      ? MONS_LIST[dexNum]?.formes[formNum]?.formeName?.toLowerCase()
      : MONS_LIST[dexNum]?.name?.toLowerCase()?.replaceAll("-", "")) ?? "";
  let formeNameSegments = formeName.split("-");
  if (formeNameSegments.length === 1) {
    formeName = formeNameSegments[0];
  } else {
    formeName =
      formeNameSegments[0] + "-" + formeNameSegments.slice(1).join("");
  }
  formeName = formeName
    .replaceAll("é", "e")
    .replaceAll("'", "")
    .replace("-own-tempo", "")
    .replace("-core", "")
    .replace(".", "")
    .replace(" ", "")
    .replace(":", "");
  return `https://play.pokemonshowdown.com/sprites/${game}${
    isShiny ? "-shiny" : ""
  }/${formeName}.${game.includes("ani") ? "gif" : "png"}`;
};

export const getPokemonDBSprite = (
  dexNum: number,
  formNum: number,
  isShiny: boolean,
  game: string
) => {
  let formeName =
    (dexNum !== 664 && dexNum !== 665
      ? MONS_LIST[dexNum]?.formes[formNum]?.formeName?.toLowerCase()
      : MONS_LIST[dexNum]?.name?.toLowerCase()) ?? "";
  formeName = formeName
    .replaceAll("é", "e")
    .replaceAll("'", "")
    .replace("-own-tempo", "")
    .replace(":", "")
    .replace(". ", "-")
    .replace(" ", "-")
    .replace(".", "")
    .replace("alola", "alolan")
    .replace("galar", "galarian")
    .replace("hisui", "hisuian")
    .replace("paldea", "paldean")
    .replace("-natural", "")
    .replace("-disguised", "");
  if (!formeName.includes("nidoran")) {
    formeName = formeName.replace(/-f$/, "-female").replace(/-m$/, "-male");
  }
  if (formeName.includes("-core")) {
    formeName = formeName.split("-core").join("") + "-core";
  }
  return `https://img.pokemondb.net/sprites/${game}/${
    isShiny ? "shiny" : "normal"
  }/${formeName}.png`;
};

export const getSerebiiSprite = (
  dexNum: number,
  formNum: number,
  isShiny: boolean,
  game: string
) => {
  let formeName: string | undefined =
    dexNum !== 664 && dexNum !== 665
      ? MONS_LIST[dexNum]?.formes[formNum]?.sprite
      : MONS_LIST[dexNum]?.name?.toLowerCase();
  formeName = formeName
    ?.replace("paldeafire", "b")
    ?.replace("paldeawater", "a");
  let monName = MONS_LIST[dexNum].formes[0].sprite;
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
    formeName = "pau";
  }
  let gameURI = game;
  if (!isShiny) {
    gameURI = serebiiInitialsToGame[game];
  }
  if (dexNum > 905) {
    dexNum = natDexToSV(dexNum);
  }
  return `https://www.serebii.net/${isShiny ? "Shiny/" : ""}${gameURI}/${
    isShiny ? "" : "pokemon/"
  }${dexNum.toString().padStart(3, "0")}${
    formeName ? `-${formeName}` : ""
  }.png`;
};

export const getUnownSprite = (formNum: number, gen: number) => {
  let form = String.fromCharCode(97 + formNum);
  if (form === "|") {
    form = "-question";
  } else if (form === "{") {
    form = "-exclamation";
  }
  if (gen === 3) {
    return `https://www.pokencyclopedia.info/sprites/gen3/spr_ruby-sapphire/spr_rs_201-${form}.png`;
  }
};

const serebiiInitialsToGame: { [key: string]: string } = {
  SWSH: "swordshield",
  SV: "scarletviolet",
};
