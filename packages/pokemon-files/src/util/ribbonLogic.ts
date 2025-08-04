import { Gen3ContestRibbons } from 'pokemon-resources'

import { uIntFromBufferBits, uIntToBufferBits } from './byteLogic'

export function gen3ContestRibbonsFromBuffer(
  dataView: DataView,
  byteOffset: number,
  bitOffset: number
) {
  const ribbons: string[] = []
  const coolRibbonsNum = uIntFromBufferBits(dataView, byteOffset, bitOffset, 3)

  for (let i = 0; i < coolRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i])
  }

  const beautyRibbonsNum = uIntFromBufferBits(dataView, byteOffset, bitOffset + 3, 3)

  for (let i = 0; i < beautyRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 4])
  }

  const cuteRibbonsNum = uIntFromBufferBits(dataView, byteOffset, bitOffset + 6, 3)

  for (let i = 0; i < cuteRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 8])
  }

  const smartRibbonsNum = uIntFromBufferBits(dataView, byteOffset, bitOffset + 9, 3)

  for (let i = 0; i < smartRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 12])
  }

  const toughRibbonsNum = uIntFromBufferBits(dataView, byteOffset, bitOffset + 12, 3)

  for (let i = 0; i < toughRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 16])
  }

  return ribbons
}

export function gen3ContestRibbonsFromBytes(dataView: DataView, byteOffset: number) {
  const ribbons: string[] = []
  const coolRibbonsNum = dataView.getUint8(byteOffset)

  for (let i = 0; i < coolRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i])
  }

  const beautyRibbonsNum = dataView.getUint8(byteOffset + 1)

  for (let i = 0; i < beautyRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 4])
  }

  const cuteRibbonsNum = dataView.getUint8(byteOffset + 2)

  for (let i = 0; i < cuteRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 8])
  }

  const smartRibbonsNum = dataView.getUint8(byteOffset + 3)

  for (let i = 0; i < smartRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 12])
  }

  const toughRibbonsNum = dataView.getUint8(byteOffset + 4)

  for (let i = 0; i < toughRibbonsNum; i++) {
    ribbons.push(Gen3ContestRibbons[i + 16])
  }

  return ribbons
}

export function gen3ContestRibbonsToBuffer(
  dataView: DataView,
  byteOffset: number,
  bitOffset: number,
  ribbons: string[]
) {
  let maxCoolRibbon = 0
  let maxBeautyRibbon = 0
  let maxCuteRibbon = 0
  let maxSmartRibbon = 0
  let maxToughRibbon = 0

  ribbons.forEach((ribbon) => {
    if (Gen3ContestRibbons.includes(ribbon)) {
      let ribbonVal = 0
      const [ribbonCategory, ribbonLevel] = ribbon.split(' ')

      switch (ribbonLevel) {
        case '(Hoenn)':
          ribbonVal = 1
          break
        case 'Super':
          ribbonVal = 2
          break
        case 'Hyper':
          ribbonVal = 3
          break
        case 'Master':
          ribbonVal = 4
      }

      switch (ribbonCategory) {
        case 'Cool':
          maxCoolRibbon = Math.max(maxCoolRibbon, ribbonVal)
          break
        case 'Beauty':
          maxBeautyRibbon = Math.max(maxBeautyRibbon, ribbonVal)
          break
        case 'Cute':
          maxCuteRibbon = Math.max(maxCuteRibbon, ribbonVal)
          break
        case 'Smart':
          maxSmartRibbon = Math.max(maxSmartRibbon, ribbonVal)
          break
        case 'Tough':
          maxToughRibbon = Math.max(maxToughRibbon, ribbonVal)
          break
      }
    }
  })
  uIntToBufferBits(dataView, maxCoolRibbon, byteOffset, bitOffset, 3)
  uIntToBufferBits(dataView, maxBeautyRibbon, byteOffset, bitOffset + 3, 3)
  uIntToBufferBits(dataView, maxCuteRibbon, byteOffset, bitOffset + 6, 3)
  uIntToBufferBits(dataView, maxSmartRibbon, byteOffset, bitOffset + 9, 3)
  uIntToBufferBits(dataView, maxToughRibbon, byteOffset, bitOffset + 12, 3)
}

export function gen3ContestRibbonsToBytes(
  dataView: DataView,
  byteOffset: number,
  ribbons: string[]
) {
  let maxCoolRibbon = 0
  let maxBeautyRibbon = 0
  let maxCuteRibbon = 0
  let maxSmartRibbon = 0
  let maxToughRibbon = 0

  ribbons.forEach((ribbon) => {
    if (Gen3ContestRibbons.includes(ribbon)) {
      let ribbonVal = 0
      const [ribbonCategory, ribbonLevel] = ribbon.split(' ')

      switch (ribbonLevel) {
        case '(Hoenn)':
          ribbonVal = 1
          break
        case 'Super':
          ribbonVal = 2
          break
        case 'Hyper':
          ribbonVal = 3
          break
        case 'Master':
          ribbonVal = 4
      }

      switch (ribbonCategory) {
        case 'Cool':
          maxCoolRibbon = Math.max(maxCoolRibbon, ribbonVal)
          break
        case 'Beauty':
          maxBeautyRibbon = Math.max(maxBeautyRibbon, ribbonVal)
          break
        case 'Cute':
          maxCuteRibbon = Math.max(maxCuteRibbon, ribbonVal)
          break
        case 'Smart':
          maxSmartRibbon = Math.max(maxSmartRibbon, ribbonVal)
          break
        case 'Tough':
          maxToughRibbon = Math.max(maxToughRibbon, ribbonVal)
          break
      }
    }
  })
  dataView.setUint8(byteOffset, maxCoolRibbon)
  dataView.setUint8(byteOffset + 1, maxBeautyRibbon)
  dataView.setUint8(byteOffset + 2, maxCuteRibbon)
  dataView.setUint8(byteOffset + 3, maxSmartRibbon)
  dataView.setUint8(byteOffset + 4, maxToughRibbon)
}

export function filterRibbons(ribbons: string[], ribbonSets: string[][], maxRibbon?: string) {
  if (ribbonSets.length === 1) {
    const ribbonSet = ribbonSets[0]
    const maxIndex = maxRibbon ? ribbonSet.indexOf(maxRibbon) : Number.POSITIVE_INFINITY

    return ribbons.filter((ribbon) => {
      const index = ribbonSet.indexOf(ribbon)

      return index > -1 && index <= maxIndex
    })
  }

  return ribbons.filter((ribbon) => ribbonSets.some((ribbonSet) => ribbonSet.includes(ribbon)))
}
