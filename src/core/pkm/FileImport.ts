import {
  COLOPKM,
  PA8,
  PA9,
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
} from '@openhome-core/pkm'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import PB8LUMI from '@openhome-core/save/luminescentplatinum/PB8LUMI'
import PK3RR from '@openhome-core/save/radicalred/PK3RR'
import PK3UB from '@openhome-core/save/unbound/PK3UB'
import { AnyPkmClass, SavePkmClass } from '@openhome-core/save/util'
import { PkmFormat } from '@pkm-rs/pkg/pkm_rs'
import PK9Compass from '../save/compass/PK9Compass'
import { isPkmFormat, PkmOrOhpkmFormat } from './util'

function fileTypeFromBytes(bytes: Uint8Array): SavePkmClass | undefined {
  switch (bytes.length) {
    case 69:
      return PK1
    case 73:
      return PK2
    case 80:
    case 100:
      return PK3
    case 58:
      return PK3RR
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

export function fileTypeFromStringNonOhpkm(type: PkmFormat): SavePkmClass | undefined {
  const typeUpper = type.toUpperCase() as Uppercase<PkmFormat>
  switch (typeUpper) {
    case 'PK1':
      return PK1
    case 'PK2':
      return PK2
    case 'PK3':
      return PK3
    case 'PK3RR':
      return PK3RR
    case 'PK3UB':
      return PK3UB
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
    case 'PB8LUMI':
      return PB8LUMI
    case 'PK9':
      return PK9
    case 'PK9COMPASS':
      return PK9Compass
    case 'PA9':
      return PA9
  }
}

function fileTypeFromString(type: PkmOrOhpkmFormat): AnyPkmClass | undefined {
  if (type === 'OHPKM') {
    return OHPKM
  }
  return fileTypeFromStringNonOhpkm(type)
}

export const bytesToPKM = (bytes: Uint8Array, extension: string): PKMInterface => {
  let T: AnyPkmClass | undefined

  if (extension === '' || extension.toUpperCase() === 'PKM') {
    T = fileTypeFromBytes(new Uint8Array(bytes))
  } else if (isPkmFormat(extension) || extension === 'OHPKM') {
    T = fileTypeFromString(extension)
  } else {
    console.error(`unknown pkm extension: ${extension}`)
  }

  if (!T) {
    throw `Unrecognized file`
  }

  return T.fromBytes(bytes.buffer as ArrayBuffer)
}
