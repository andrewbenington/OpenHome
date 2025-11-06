import { getFlag, setFlag, uIntFromBufferBits, uIntToBufferBits } from './byteLogic'

export type ToBytesOptions = {
  includeExtraFields?: boolean
}

export interface PKMDate {
  year: number
  month: number
  day: number
}

export function pkmDateFromBytes(dataView: DataView, offset: number): PKMDate | undefined {
  if (dataView.getUint8(offset + 1) === 0) return undefined
  return {
    year: dataView.getUint8(offset) + 2000,
    month: dataView.getUint8(offset + 1),
    day: dataView.getUint8(offset + 2),
  }
}

export function writePKMDateToBytes(dataView: DataView, offset: number, date: PKMDate | undefined) {
  dataView.setUint8(offset, date ? date.year - 2000 : 0)
  dataView.setUint8(offset + 1, date ? date.month : 0)
  dataView.setUint8(offset + 2, date ? date.day : 0)
}

export interface Memory {
  intensity: number
  memory: number
  feeling: number
  textVariables: number
}

export interface Stats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export type StatAbbr = keyof Stats

export interface StatsPreSplit {
  hp: number
  atk: number
  def: number
  spc: number
  spe: number
}

export interface HyperTrainStats {
  hp: boolean
  atk: boolean
  def: boolean
  spa: boolean
  spd: boolean
  spe: boolean
}

export interface ContestStats {
  cool: number
  beauty: number
  cute: number
  smart: number
  tough: number
  sheen: number
}

export function readStatsFromBytesU8(dataView: DataView, offset: number) {
  return {
    hp: dataView.getUint8(offset),
    atk: dataView.getUint8(offset + 1),
    def: dataView.getUint8(offset + 2),
    spe: dataView.getUint8(offset + 3),
    spa: dataView.getUint8(offset + 4),
    spd: dataView.getUint8(offset + 5),
  }
}

export function writeStatsToBytesU8(dataView: DataView, offset: number, value: Stats) {
  dataView.setUint8(offset, value.hp)
  dataView.setUint8(offset + 1, value.atk)
  dataView.setUint8(offset + 2, value.def)
  dataView.setUint8(offset + 3, value.spe)
  dataView.setUint8(offset + 4, value.spa)
  dataView.setUint8(offset + 5, value.spd)
}

export function readStatsFromBytesU16(dataView: DataView, offset: number) {
  return {
    hp: dataView.getUint16(offset, true),
    atk: dataView.getUint16(offset + 2, true),
    def: dataView.getUint16(offset + 4, true),
    spe: dataView.getUint16(offset + 6, true),
    spa: dataView.getUint16(offset + 8, true),
    spd: dataView.getUint16(offset + 10, true),
  }
}

export function writeStatsToBytesU16(dataView: DataView, offset: number, value: Stats) {
  dataView.setUint16(offset, value.hp, true)
  dataView.setUint16(offset + 2, value.atk, true)
  dataView.setUint16(offset + 4, value.def, true)
  dataView.setUint16(offset + 6, value.spe, true)
  dataView.setUint16(offset + 8, value.spa, true)
  dataView.setUint16(offset + 10, value.spd, true)
}

export function read30BitIVsFromBytes(dataView: DataView, offset: number): Stats {
  const ivBytes = uIntFromBufferBits(dataView, offset, 0, 30)

  return {
    hp: ivBytes & 0x1f,
    atk: (ivBytes >> 5) & 0x1f,
    def: (ivBytes >> 10) & 0x1f,
    spe: (ivBytes >> 15) & 0x1f,
    spa: (ivBytes >> 20) & 0x1f,
    spd: (ivBytes >> 25) & 0x1f,
  }
}

export const writeHyperTrainStatsToBytes = (
  dataView: DataView,
  offset: number,
  value: HyperTrainStats
) => {
  setFlag(dataView, offset, 0, value.hp)
  setFlag(dataView, offset, 1, value.atk)
  setFlag(dataView, offset, 2, value.def)
  setFlag(dataView, offset, 3, value.spa)
  setFlag(dataView, offset, 4, value.spd)
  setFlag(dataView, offset, 5, value.spe)
}

export function readHyperTrainStatsFromBytes(dataView: DataView, offset: number): HyperTrainStats {
  return {
    hp: getFlag(dataView, offset, 0),
    atk: getFlag(dataView, offset, 1),
    def: getFlag(dataView, offset, 2),
    spa: getFlag(dataView, offset, 3),
    spd: getFlag(dataView, offset, 4),
    spe: getFlag(dataView, offset, 5),
  }
}

export const write30BitIVsToBytes = (dataView: DataView, offset: number, value: Stats) => {
  // preserve highest two bits
  let ivsValue = 0

  ivsValue |= (value.spd & 0x1f) << 25
  ivsValue |= (value.spa & 0x1f) << 20
  ivsValue |= (value.spe & 0x1f) << 15
  ivsValue |= (value.def & 0x1f) << 10
  ivsValue |= (value.atk & 0x1f) << 5
  ivsValue |= value.hp & 0x1f
  uIntToBufferBits(dataView, ivsValue, offset, 0, 30)
}

export function readContestStatsFromBytes(dataView: DataView, offset: number) {
  return {
    cool: dataView.getUint8(offset),
    beauty: dataView.getUint8(offset + 1),
    cute: dataView.getUint8(offset + 2),
    smart: dataView.getUint8(offset + 3),
    tough: dataView.getUint8(offset + 4),
    sheen: dataView.getUint8(offset + 5),
  }
}

export function writeContestStatsToBytes(dataView: DataView, offset: number, value: ContestStats) {
  dataView.setUint8(offset, value.cool)
  dataView.setUint8(offset + 1, value.beauty)
  dataView.setUint8(offset + 2, value.cute)
  dataView.setUint8(offset + 3, value.smart)
  dataView.setUint8(offset + 4, value.tough)
  dataView.setUint8(offset + 5, value.sheen)
}

export interface Geolocation {
  region: number
  country: number
}

export type marking = 0 | 1 | 2

export type MarkingsFourShapes = {
  circle: boolean
  square: boolean
  triangle: boolean
  heart: boolean
}

export type MarkingsSixShapesNoColor = {
  circle: boolean
  triangle: boolean
  square: boolean
  heart: boolean
  star: boolean
  diamond: boolean
}

export type MarkingColorValue = null | 'blue' | 'red'

export type MarkingsSixShapesWithColor = {
  circle: MarkingColorValue
  triangle: MarkingColorValue
  square: MarkingColorValue
  heart: MarkingColorValue
  star: MarkingColorValue
  diamond: MarkingColorValue
}

export type Markings = MarkingsFourShapes | MarkingsSixShapesNoColor | MarkingsSixShapesWithColor

export function markingsHaveColor(markings: Markings): markings is MarkingsSixShapesWithColor {
  return typeof markings.circle !== 'boolean'
}

export function markingsFourShapesFromBytes(
  dataView: DataView,
  offset: number
): MarkingsFourShapes {
  return {
    circle: getFlag(dataView, offset, 0),
    square: getFlag(dataView, offset, 1),
    triangle: getFlag(dataView, offset, 2),
    heart: getFlag(dataView, offset, 3),
  }
}

export function markingsFourShapesToBytes(
  dataView: DataView,
  offset: number,
  value: MarkingsFourShapes
) {
  setFlag(dataView, offset, 0, value.circle)
  setFlag(dataView, offset, 1, value.square)
  setFlag(dataView, offset, 2, value.triangle)
  setFlag(dataView, offset, 3, value.heart)
}

export function markingsSixShapesNoColorFromBytes(
  dataView: DataView,
  offset: number
): MarkingsSixShapesNoColor {
  return {
    circle: getFlag(dataView, offset, 0),
    triangle: getFlag(dataView, offset, 1),
    square: getFlag(dataView, offset, 2),
    heart: getFlag(dataView, offset, 3),
    star: getFlag(dataView, offset, 4),
    diamond: getFlag(dataView, offset, 5),
  }
}

export function markingsSixShapesNoColorToBytes(
  dataView: DataView,
  offset: number,
  value: MarkingsSixShapesNoColor
) {
  setFlag(dataView, offset, 0, value.circle)
  setFlag(dataView, offset, 1, value.triangle)
  setFlag(dataView, offset, 2, value.square)
  setFlag(dataView, offset, 3, value.heart)
  setFlag(dataView, offset, 4, value.star)
  setFlag(dataView, offset, 5, value.diamond)
}

export function twoColorMarkingFromInt(value: number): MarkingColorValue {
  switch (value) {
    case 1:
      return 'blue'
    case 2:
      return 'red'
    default:
      return null
  }
}

export function twoColorMarkingToInt(marking: MarkingColorValue): number {
  switch (marking) {
    case 'blue':
      return 1
    case 'red':
      return 2
    default:
      return 0
  }
}

export function markingsFourShapesFromOther(other?: Markings): MarkingsFourShapes {
  if (!other) {
    return {
      circle: false,
      triangle: false,
      square: false,
      heart: false,
    }
  }

  return {
    circle: !!other.circle,
    triangle: !!other.triangle,
    square: !!other.square,
    heart: !!other.heart,
  }
}

export function markingsSixShapesNoColorFromOther(other?: Markings): MarkingsSixShapesNoColor {
  if (!other) {
    return {
      circle: false,
      triangle: false,
      square: false,
      heart: false,
      star: false,
      diamond: false,
    }
  }

  return {
    circle: !!other.circle,
    triangle: !!other.triangle,
    square: !!other.square,
    heart: !!other.heart,
    star: 'star' in other && !!other.star,
    diamond: 'diamond' in other && !!other.diamond,
  }
}

export function markingColorValueFromOther(marking: boolean | MarkingColorValue) {
  switch (marking) {
    case true:
      return 'blue'
    case false:
      return null
    default:
      return marking
  }
}

export function markingsSixShapesWithColorFromOther(other?: Markings): MarkingsSixShapesWithColor {
  if (!other) {
    return {
      circle: null,
      triangle: null,
      square: null,
      heart: null,
      star: null,
      diamond: null,
    }
  }

  const coloredMarkings: MarkingsSixShapesWithColor = {
    circle: markingColorValueFromOther(other.circle),
    triangle: markingColorValueFromOther(other.triangle),
    square: markingColorValueFromOther(other.square),
    heart: markingColorValueFromOther(other.heart),
    star: null,
    diamond: null,
  }

  if ('star' in other) {
    coloredMarkings.star = markingColorValueFromOther(other.star)
    coloredMarkings.diamond = markingColorValueFromOther(other.diamond)
  }

  return coloredMarkings
}

export function markingsSixShapesWithColorFromBytes(
  data: DataView,
  offset: number
): MarkingsSixShapesWithColor {
  const markingsValue = data.getUint16(offset, true)

  return {
    circle: twoColorMarkingFromInt(markingsValue & 3),
    triangle: twoColorMarkingFromInt((markingsValue >> 2) & 3),
    square: twoColorMarkingFromInt((markingsValue >> 4) & 3),
    heart: twoColorMarkingFromInt((markingsValue >> 6) & 3),
    star: twoColorMarkingFromInt((markingsValue >> 8) & 3),
    diamond: twoColorMarkingFromInt((markingsValue >> 10) & 3),
  }
}

export function markingsSixShapesWithColorToBytes(
  dataView: DataView,
  offset: number,
  value: MarkingsSixShapesWithColor
) {
  uIntToBufferBits(dataView, twoColorMarkingToInt(value.circle), offset, 0, 2)
  uIntToBufferBits(dataView, twoColorMarkingToInt(value.triangle), offset, 2, 2)
  uIntToBufferBits(dataView, twoColorMarkingToInt(value.square), offset, 4, 2)
  uIntToBufferBits(dataView, twoColorMarkingToInt(value.heart), offset, 6, 2)
  uIntToBufferBits(dataView, twoColorMarkingToInt(value.star), offset, 8, 2)
  uIntToBufferBits(dataView, twoColorMarkingToInt(value.diamond), offset, 10, 2)
}

export function readDVsFromBytes(dataView: DataView, offset: number): StatsPreSplit {
  const dvBytes = dataView.getUint16(offset, false)

  return {
    spc: dvBytes & 0x0f,
    spe: (dvBytes >> 4) & 0x0f,
    def: (dvBytes >> 8) & 0x0f,
    atk: (dvBytes >> 12) & 0x0f,
    hp:
      (((dvBytes >> 12) & 1) << 3) |
      (((dvBytes >> 8) & 1) << 2) |
      (((dvBytes >> 4) & 1) << 1) |
      (dvBytes & 1),
  }
}

export function writeDVsToBytes(dvs: StatsPreSplit, buffer: DataView, offset: number) {
  let dvBytes = dvs.atk & 0x0f

  dvBytes = (dvBytes << 4) | (dvs.def & 0x0f)
  dvBytes = (dvBytes << 4) | (dvs.spe & 0x0f)
  dvBytes = (dvBytes << 4) | (dvs.spc & 0x0f)
  buffer.setUint16(offset, dvBytes, false)
}

export function readSwitchTrainerMemoryFromBytes(dataView: DataView, offset: number): Memory {
  return {
    intensity: dataView.getUint8(offset),
    memory: dataView.getUint8(offset + 1),
    textVariables: dataView.getUint16(offset + 3, true),
    feeling: dataView.getUint8(offset + 5),
  }
}

export function readSwitchHandlerMemoryFromBytes(dataView: DataView, offset: number): Memory {
  return {
    intensity: dataView.getUint8(offset),
    memory: dataView.getUint8(offset + 1),
    feeling: dataView.getUint8(offset + 2),
    textVariables: dataView.getUint16(offset + 3, true),
  }
}

export function read3DSTrainerMemoryFromBytes(dataView: DataView, offset: number): Memory {
  return {
    intensity: dataView.getUint8(offset),
    memory: dataView.getUint8(offset + 1),
    textVariables: dataView.getUint16(offset + 2, true),
    feeling: dataView.getUint8(offset + 4),
  }
}

export function read3DSHandlerMemoryFromBytes(dataView: DataView, offset: number): Memory {
  return {
    intensity: dataView.getUint8(offset),
    memory: dataView.getUint8(offset + 1),
    feeling: dataView.getUint8(offset + 2),
    textVariables: dataView.getUint16(offset + 4, true),
  }
}

export function writeSwitchTrainerMemoryToBytes(dataView: DataView, offset: number, value: Memory) {
  dataView.setUint8(offset, value.intensity)
  dataView.setUint8(offset + 1, value.memory)
  dataView.setUint16(offset + 3, value.textVariables, true)
  dataView.setUint8(offset + 5, value.feeling)
}

export function writeSwitchHandlerMemoryToBytes(dataView: DataView, offset: number, value: Memory) {
  dataView.setUint8(offset, value.intensity)
  dataView.setUint8(offset + 1, value.memory)
  dataView.setUint8(offset + 2, value.feeling)
  dataView.setUint16(offset + 3, value.textVariables, true)
}

export function write3DSTrainerMemoryToBytes(dataView: DataView, offset: number, value: Memory) {
  dataView.setUint8(offset, value.intensity)
  dataView.setUint8(offset + 1, value.memory)
  dataView.setUint16(offset + 2, value.textVariables, true)
  dataView.setUint8(offset + 4, value.feeling)
}

export function write3DSHandlerMemoryToBytes(dataView: DataView, offset: number, value: Memory) {
  dataView.setUint8(offset, value.intensity)
  dataView.setUint8(offset + 1, value.memory)
  dataView.setUint8(offset + 2, value.feeling)
  dataView.setUint16(offset + 4, value.textVariables, true)
}

export function readGeolocationFromBytes(dataView: DataView, offset: number): Geolocation {
  return {
    region: dataView.getUint8(offset),
    country: dataView.getUint8(offset + 1),
  }
}

export function writeGeolocationToBytes(dataView: DataView, offset: number, value: Geolocation) {
  dataView.setUint8(offset, value.region)
  dataView.setUint8(offset + 1, value.country)
}

export type Stat = keyof Stats
