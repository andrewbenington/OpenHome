import { getGenderRatio } from 'pokemon-species-data'

const gen3To5MaleThreshold: { [key: number]: number } = {
  0: 254,
  0.125: 225,
  0.25: 191,
  0.5: 127,
  0.75: 63,
  0.875: 31,
  1: 0,
}

export const getGen3To5Gender = (PID: number, dexNum: number) => {
  if (dexNum === 0) {
    return 2
  }
  const genderRatio = getGenderRatio(dexNum, 0)
  const maleRatio = genderRatio.male > 0 || genderRatio.female > 0 ? genderRatio.male : -1

  if (maleRatio === -1) {
    return 2
  }
  if (maleRatio === 0) {
    return 1
  }
  return (PID & 0xff) >= gen3To5MaleThreshold[maleRatio] ? 0 : 1
}
