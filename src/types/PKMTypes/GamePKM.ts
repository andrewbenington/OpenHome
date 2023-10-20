import { COLOPKM } from './COLOPKM'
import { PA8 } from './PA8'
import { PB7 } from './PB7'
import { PK1 } from './PK1'
import { PK2 } from './PK2'
import { PK3 } from './PK3'
import { PK4 } from './PK4'
import { PK5 } from './PK5'
import { PK6 } from './PK6'
import { PK7 } from './PK7'
import { PB8, PK8 } from './PK8'
import { PK9 } from './PK9'
import { XDPKM } from './XDPKM'

export type GamePKM =
  | PK1
  | PK2
  | PK3
  | COLOPKM
  | XDPKM
  | PK4
  | PK5
  | PK6
  | PK7
  | PB7
  | PK8
  | PB8
  | PA8
  | PK9

export type GamePKMType =
  | typeof PK1
  | typeof PK2
  | typeof PK3
  | typeof COLOPKM
  | typeof XDPKM
  | typeof PK4
  | typeof PK5
  | typeof PK6
  | typeof PK7
  | typeof PB7
  | typeof PK8
  | typeof PB8
  | typeof PA8
  | typeof PK9

export function fileTypeFromString(type: string): GamePKMType | undefined {
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
    default:
      return undefined
  }
}
