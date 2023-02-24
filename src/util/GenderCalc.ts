import { POKEMON_DATA } from "../consts/Mons";

export const getGen3To5Gender = (PID: number, dexNum: number) => {
  if (dexNum === 0) {
    return 2
  }
  let maleRatio =
    POKEMON_DATA[dexNum].formes[0].genderRatio.M > 0 ||
    POKEMON_DATA[dexNum].formes[0].genderRatio.F > 0
      ? POKEMON_DATA[dexNum].formes[0].genderRatio.M
      : -1;
  if (maleRatio === -1) {
    return 2;
  } else if (maleRatio === 0) {
    return 1;
  } else {
    return PID % 256 >= gen3To5MaleThreshold[maleRatio] ? 0 : 1;
  }
};

const gen3To5MaleThreshold: { [key: number]: number } = {
  0: 254,
  0.125: 225,
  0.25: 191,
  0.5: 127,
  0.75: 63,
  0.875: 31,
  1: 0,
};
