import { Gen8OnData } from './gen8'

export interface Gen9OnlyData extends Gen8OnData {
  obedienceLevel: number
  tmFlagsSV: Uint8Array
  tmFlagsSVDLC: Uint8Array

  teraTypeOriginal: number
  teraTypeOverride: number
}

export function hasGen9OnlyData(obj: any): obj is Gen9OnlyData {
  return obj && 'tmFlagsSV' in obj
}
