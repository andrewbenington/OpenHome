import { OhpkmIdentifier } from '../../pkm/Lookup'

export type SaveFolder = {
  path: string
  label?: string
}

export type StoredBankData = {
  banks: OpenHomeBank[]
  current_bank: number
}

export type OpenHomeBank = {
  id: string
  index: number
  name: string | undefined
  boxes: OpenHomeBox[]
  current_box: number
}

export type OpenHomeBox = {
  id: string
  index: number
  name: string | null
  identifiers: BoxMonIdentifiers
}

export type BoxMonIdentifiers = Map<number, OhpkmIdentifier>

export function getBankName(bank: OpenHomeBank): string {
  return bank.name ?? `Bank ${bank.index + 1}`
}
