import { GameOfOrigin } from 'pokemon-resources'

import { COLOPKM, PA8, PB7, PB8, PK1, PK2, PK3, PK4, PK5, PK6, PK7, PK8, PK9, PKM, XDPKM } from '.'

function fileTypeFromBuffer(buffer: ArrayBuffer): string | undefined {
  switch (buffer.byteLength) {
    case 69:
      return 'PK1'
    case 73:
      return 'PK2'
    case 80:
    case 100:
      return 'PK3'
    case 136:
      if (
        new DataView(buffer).getUint8(0x5f) >= GameOfOrigin.White ||
        new DataView(buffer).getUint16(0x80) === 30001
      ) {
        return 'PK5'
      }

      return 'PK4'
    case 236:
      return 'PK4'
    case 220:
      return 'PK5'
    default:
      return undefined
  }
}

export function classFromFormat(format: string) {
  switch (format) {
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
    // case 'OHPKM':
    //   return OHPKM
    default:
      return undefined
  }
}

export const bytesToPKMInterface = (bytes: ArrayBuffer, extension: string): PKM => {
  let format: string | undefined = extension

  if (format === '' || format === 'PKM') {
    format = fileTypeFromBuffer(bytes)
  }

  if (!format) {
    throw `Unrecognized file`
  }

  const pkmClass = classFromFormat(format)

  if (!pkmClass) {
    throw `Unrecognized file`
  }

  return new pkmClass(bytes)
}
