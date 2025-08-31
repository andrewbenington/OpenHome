export type SaveFolder = {
  path: string
  label?: string
}

export type StoredBankData = {
  banks: OpenHomeBank[]
  current_bank: number
}

export type OpenHomeBank = {
  index: number
  name: string | undefined
  boxes: OpenHomeBox[]
  current_box: number
}

export type OpenHomeBox = {
  index: number
  name: string | undefined
  identifiers: BoxMonIdentifiers
}

export type BoxMonIdentifiers = Record<number, string>

export function getBankName(bank: OpenHomeBank): string {
  return bank.name ?? `Bank ${bank.index + 1}`
}
