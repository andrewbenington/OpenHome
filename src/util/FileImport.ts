import {
  COLOPKM,
  OHPKM,
  PA8,
  PB7,
  PB8,
  PK1,
  PK2,
  PK3,
  PK4,
  PK5,
  PK6,
  PK7,
  PK8,
  PK9,
  XDPKM,
} from '../types/PKMTypes'
import { GamePKMType } from '../types/PKMTypes/GamePKM'
import { PKM, PKMType } from '../types/PKMTypes/PKM'

function fileTypeFromBytes(bytes: Uint8Array): GamePKMType | undefined {
  switch (bytes.length) {
    case 69:
      return PK1
    case 73:
      return PK2
    case 80:
    case 100:
      return PK3
    case 136:
      return bytes[0x5f] < 20 ? PK4 : PK5
    case 236:
      return PK4
    case 220:
      return PK5
    default:
      return undefined
  }
}

export function fileTypeFromString(type: string): PKMType | undefined {
  switch (type) {
    case 'PK1':
      return PK1
    case 'PK2':
      return PK2
    case 'PK3':
      return PK3
    case 'COLOPKM':
      return COLOPKM
    case 'XDPKM':
      return XDPKM
    case 'PK4':
      return PK4
    case 'PK5':
      return PK5
    case 'PK6':
      return PK6
    case 'PK7':
      return PK7
    case 'PB7':
      return PB7
    case 'PK8':
      return PK8
    case 'PA8':
      return PA8
    case 'PB8':
      return PB8
    case 'PK9':
      return PK9
    case 'OHPKM':
      return OHPKM
    default:
      return undefined
  }
}

export const bytesToPKM = (bytes: Uint8Array, extension: string): PKM => {
  let T: PKMType | undefined
  if (extension === '' || extension === 'PKM') {
    T = fileTypeFromBytes(bytes)
  } else {
    T = fileTypeFromString(extension)
  }
  if (!T) {
    throw `Unrecognized file`
  }
  return new T(bytes)
}
