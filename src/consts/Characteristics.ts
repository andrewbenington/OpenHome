import { max } from "lodash";
import { stats } from "../pkm/pkm";

export const getCharacteristic = (
  ivs: stats,
  tiebreaker: number,
  preGen6: boolean = false
) => {
  let stats = ["hp", "atk", "def", "spe", "spa", "spd"];
  let maxIV = max(Object.values(ivs));
  let lastIndex = tiebreaker % 6 === 0 ? 5 : (tiebreaker % 6) - 1;
  let determiningIV = "hp";
  for (let i = tiebreaker % 6; i !== lastIndex; i = (i + 1) % 6) {
    if ((ivs as any)[stats[i]] === maxIV) {
      determiningIV = stats[i];
      break;
    }
  }
  switch (determiningIV) {
    case "hp":
      return preGen6
        ? hpCharacteristicsPre6[maxIV % 5]
        : hpCharacteristics[maxIV % 6];
    case "atk":
      return atkCharacteristics[maxIV % 5];
    case "def":
      return defCharacteristics[maxIV % 5];
    case "spa":
      return spaCharacteristics[maxIV % 5];
    case "spd":
      return spdCharacteristics[maxIV % 5];
    default:
      return speCharacteristics[maxIV % 5];
  }
};

const hpCharacteristicsPre6 = [
  "Loves to eat",
  "Often dozes off",
  "Often scatters things",
  "Scatters things often",
  "Likes to relax",
];

const hpCharacteristics = [
  "Loves to eat",
  "Takes plenty of siestas",
  "Nods off a lot",
  "Scatters things often",
  "Likes to relax",
];

const atkCharacteristics = [
  "Proud of its power",
  "Likes to thrash about",
  "A little quick tempered",
  "Likes to fight",
  "Quick tempered",
];

const defCharacteristics = [
  "Sturdy body",
  "Capable of taking hits",
  "Highly persistent",
  "Good endurance",
  "Good perseverance",
];

const spaCharacteristics = [
  "Highly curious",
  "Mischievous",
  "Thoroughly cunning",
  "Often lost in thought",
  "Very finicky",
];

const spdCharacteristics = [
  "Strong willed",
  "Somewhat vain",
  "Strongly defiant",
  "Hates to lose",
  "Somewhat stubborn",
];

const speCharacteristics = [
  "Likes to run",
  "Alert to sounds",
  "Impetuous and silly",
  "Somewhat of a clown",
  "Quick to flee",
];
