import { PK1, PK2, PK3, PK4, PK5 } from '../types/PKMTypes'
import { GamePKM, GamePKMType, fileTypeFromString } from '../types/PKMTypes/GamePKM'

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

export const bytesToPKM = (bytes: Uint8Array, extension: string): GamePKM => {
  let T: GamePKMType | undefined
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
