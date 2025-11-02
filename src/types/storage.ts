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
  customization?: BoxCustomization
}

export type BoxCustomization = {
  color?: string
  image?: string
}

export type BoxMonIdentifiers = Record<number, string>

export function getBankName(bank: OpenHomeBank): string {
  return bank.name ?? `Bank ${bank.index + 1}`
}
