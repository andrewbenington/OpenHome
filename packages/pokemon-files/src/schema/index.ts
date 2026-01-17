import COLOPKMSchema from './COLOPKM.json'
import PA8Schema from './PA8.json'
import PB7Schema from './PB7.json'
import PB8Schema from './PB8.json'
import PK1Schema from './PK1.json'
import PK2Schema from './PK2.json'
import PK3Schema from './PK3.json'
import PK4Schema from './PK4.json'
import PK5Schema from './PK5.json'
import PK6Schema from './PK6.json'
import PK7Schema from './PK7.json'
import PK8Schema from './PK8.json'
import PK9Schema from './PK9.json'
import XDPKMSchema from './XDPKM.json'

export type SchemaField = {
  name?: string
  type?: string
  byteOffset?: number
  numBytes?: number
  conversion?: {
    type: string
    name: string
    inputType?: string
    outputType: string
  }
  noWrite?: boolean
  default?: number | string
  tupleType?: string
  tupleLength?: number
  endian?: string
  bitOffset?: number
  numBits?: number
  seperateBytes?: boolean
  lengthCheck?: number
  terminateString?: boolean
}

export type Schema = {
  fileName: string
  fields: SchemaField[]
  stringEncoding: string
  endian: string
  totalBytes: number
  totalBytesExtraFields?: number
  natureFromPV?: boolean
  unownFromPV?: boolean
  genderFromPV?: boolean
  pvAbilityBit?: number
  genderFromDVs?: boolean
  unownFromIVs?: boolean
  noFormes?: boolean
  detectPrefix?: boolean
  shinyFromDVs?: boolean
  shinyThreshold?: number
  maxValidMove: number
  maxRibbon?: string
  maxBall?: number
  allowedBalls?: number[]
  defaultBall?: string
  checksumStart?: number
  checksumEnd?: number
  isGen3?: boolean
  trainerIDTracker?: boolean
  markingType?: string
  memoryType?: string
}

export const FileSchemas: Record<string, Schema> = {
  PK1: PK1Schema,
  PK2: PK2Schema,
  PK3: PK3Schema,
  PK4: PK4Schema,
  PK5: PK5Schema,
  PK6: PK6Schema,
  PK7: PK7Schema,
  PB7: PB7Schema,
  PK8: PK8Schema,
  PA8: PA8Schema,
  PB8: PB8Schema,
  PK9: PK9Schema,
  COLOPKM: COLOPKMSchema,
  XDPKM: XDPKMSchema,
}
