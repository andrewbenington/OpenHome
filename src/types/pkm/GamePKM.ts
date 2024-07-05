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
