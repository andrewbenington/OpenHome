// import { TextDecoder } from 'node:util' // (ESM style imports)
import { TransferRestrictions } from '@openhome-core/save/util/TransferRestrictions'
import { difference } from 'lodash'
import { describe, test } from 'vitest'
import {
  BDSP_TRANSFER_RESTRICTIONS,
  BW2_TRANSFER_RESTRICTIONS,
  BW_TRANSFER_RESTRICTIONS,
  DP_TRANSFER_RESTRICTIONS,
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  PT_TRANSFER_RESTRICTIONS,
  SM_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS_ID,
  SWSH_TRANSFER_RESTRICTIONS_BASE,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  SWSH_TRANSFER_RESTRICTIONS_IOA,
  USUM_TRANSFER_RESTRICTIONS,
  XY_TRANSFER_RESTRICTIONS,
} from '../TransferRestrictions'

const allTransferRestrictions: Record<string, TransferRestrictions> = {
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  DP_TRANSFER_RESTRICTIONS,
  PT_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  BW_TRANSFER_RESTRICTIONS,
  BW2_TRANSFER_RESTRICTIONS,
  XY_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  SM_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
  SWSH_TRANSFER_RESTRICTIONS_BASE,
  SWSH_TRANSFER_RESTRICTIONS_IOA,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  BDSP_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS: SV_TRANSFER_RESTRICTIONS_ID,
}

describe('no repeated dex nums', () => {
  for (let [restriction, data] of Object.entries(allTransferRestrictions)) {
    test(restriction, () => {
      const present: Record<number, boolean> = {}

      if (!data.transferableDexNums) return

      for (const dexNum of data.transferableDexNums) {
        if (present[dexNum]) {
          throw new Error(`dex number occurs more than once: ${dexNum}`)
        }
      }
    })
  }
})

const strictSuperSets: Record<string, [TransferRestrictions, TransferRestrictions]> = {
  'ORAS ⊇ XY': [ORAS_TRANSFER_RESTRICTIONS, XY_TRANSFER_RESTRICTIONS],
  'USUM ⊇ Sun/Moon': [USUM_TRANSFER_RESTRICTIONS, SM_TRANSFER_RESTRICTIONS],
  'Crown Tundra ⊇ Isle of Armor': [SWSH_TRANSFER_RESTRICTIONS_CT, SWSH_TRANSFER_RESTRICTIONS_IOA],
  'Isle of Armor ⊇ SwSh Base': [SWSH_TRANSFER_RESTRICTIONS_IOA, SWSH_TRANSFER_RESTRICTIONS_BASE],
}

describe('strict supersets', () => {
  for (let [testName, [superset, subset]] of Object.entries(strictSuperSets)) {
    test(testName, () => {
      if (!superset.transferableDexNums || !subset.transferableDexNums) return

      const missingFromSuper = difference(subset.transferableDexNums, superset.transferableDexNums)

      if (missingFromSuper.length > 0) {
        throw new Error(`Superset missing values: ${missingFromSuper.join(', ')}`)
      }
    })
  }
})

describe('no duplicates', () => {
  for (let [name, restrictions] of Object.entries(allTransferRestrictions)) {
    test(`no duplicates in ${name}`, () => {
      if (restrictions.transferableDexNums) {
        for (const nationalDex of restrictions.transferableDexNums) {
          const count = restrictions.transferableDexNums.filter(
            (index) => index === nationalDex
          ).length

          if (count > 1) throw new Error(`Occurs ${count} times in ${name}: ${nationalDex}`)
        }
      }
    })
  }
})
