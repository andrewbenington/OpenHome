import _ from 'lodash'
import { Gen3OnData } from '../types/interfaces/gen3'
import { hasGen6OnData } from '../types/interfaces/gen6'

export const HPCharacteristicsPre6 = [
  'Loves to eat',
  'Often dozes off',
  'Often scatters things',
  'Scatters things often',
  'Likes to relax',
]

export const HPCharacteristics = [
  'Loves to eat',
  'Takes plenty of siestas',
  'Nods off a lot',
  'Scatters things often',
  'Likes to relax',
]

export const AttackCharacteristics = [
  'Proud of its power',
  'Likes to thrash about',
  'A little quick tempered',
  'Likes to fight',
  'Quick tempered',
]

export const DefenseCharacteristics = [
  'Sturdy body',
  'Capable of taking hits',
  'Highly persistent',
  'Good endurance',
  'Good perseverance',
]

export const SpecialAtkCharacteristics = [
  'Highly curious',
  'Mischievous',
  'Thoroughly cunning',
  'Often lost in thought',
  'Very finicky',
]

export const SpecialDefCharacteristics = [
  'Strong willed',
  'Somewhat vain',
  'Strongly defiant',
  'Hates to lose',
  'Somewhat stubborn',
]

export const SpeedCharacteristics = [
  'Likes to run',
  'Alert to sounds',
  'Impetuous and silly',
  'Somewhat of a clown',
  'Quick to flee',
]

export function getCharacteristic(mon: Gen3OnData) {
  const preGen6 = !hasGen6OnData(mon)
  const tiebreaker = preGen6 ? mon.personalityValue : mon.encryptionConstant
  if (!mon.ivs || !tiebreaker) return ''
  const statFields = ['hp', 'atk', 'def', 'spe', 'spa', 'spd']
  const maxIV = _.max(Object.values(mon.ivs))
  const lastIndex = tiebreaker % 6 === 0 ? 5 : (tiebreaker % 6) - 1
  let determiningIV = 'hp'
  for (let i = tiebreaker % 6; i !== lastIndex; i = (i + 1) % 6) {
    if ((mon.ivs as any)[statFields[i]] === maxIV) {
      determiningIV = statFields[i]
      break
    }
  }
  switch (determiningIV) {
    case 'hp':
      return preGen6 ? HPCharacteristicsPre6[maxIV % 5] : HPCharacteristics[maxIV % 5]
    case 'atk':
      return AttackCharacteristics[maxIV % 5]
    case 'def':
      return DefenseCharacteristics[maxIV % 5]
    case 'spa':
      return SpecialAtkCharacteristics[maxIV % 5]
    case 'spd':
      return SpecialDefCharacteristics[maxIV % 5]
    default:
      return SpeedCharacteristics[maxIV % 5]
  }
}
