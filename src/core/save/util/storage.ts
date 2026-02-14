import { OhpkmIdentifier } from '../../pkm/Lookup'

export type SaveFolder = {
  path: string
  label?: string
}

export type StoredBankData = {
  banks: SimpleOpenHomeBank[]
  current_bank: number
}

export type SimpleOpenHomeBank = {
  id: string
  index: number
  name: string | undefined
  boxes: SimpleOpenHomeBox[]
  current_box: number
}

export type SimpleOpenHomeBox = {
  id: string
  index: number
  name: string | null
  identifiers: BoxMonIdentifiers
}

export type BoxMonIdentifiers = Map<number, OhpkmIdentifier>

export function getBankName(bank: SimpleOpenHomeBank): string {
  return bank.name ?? `Bank ${bank.index + 1}`
}
