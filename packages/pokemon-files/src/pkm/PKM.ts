import { MonFormat, PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import PB8LUMI from '@openhome-core/save/luminescentplatinum/PB8LUMI'
import PK3RR from '@openhome-core/save/radicalred/PK3RR'
import PK3UB from '@openhome-core/save/unbound/PK3UB'
import { ConvertStrategy } from '@pkm-rs/pkg'
import COLOPKM from './COLOPKM'
import PA8 from './PA8'
import PA9 from './PA9'
import PB7 from './PB7'
import PB8 from './PB8'
import PK1 from './PK1'
import PK2 from './PK2'
import PK3 from './PK3'
import PK4 from './PK4'
import PK5 from './PK5'
import PK6 from './PK6'
import PK7 from './PK7'
import PK8 from './PK8'
import PK9 from './PK9'
import XDPKM from './XDPKM'

export type PKM =
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
  | PA8
  | PB8
  | PK9
  | PA9
  | PK7

export type RomHackPKM = PK3RR | PK3UB | PB8LUMI

export type PkmClass<P extends PKMInterface> = {
  new (arg: ArrayBuffer | OHPKM, options: PkmConstructorOptions): P
  fromBytes(bytes: ArrayBuffer, encrypted?: boolean): P
  fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): P
  getFormat(): MonFormat
}

export type PkmConstructorOptions =
  | {
      encrypted?: boolean
      strategy?: never
    }
  | {
      encrypted?: never
      strategy: ConvertStrategy
    }

export function isRomHackFormat(format: string): format is 'PK3RR' | 'PK3UB' | 'PB8LUMI' {
  return format === 'PK3RR' || format === 'PK3UB' || format === 'PB8LUMI'
}
