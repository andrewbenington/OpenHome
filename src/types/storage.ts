export type SaveFolder = {
  path: string
  label?: string
}

export type BoxMonIdentifiers = Record<number, string>

export type OpenHomeBox = {
  index: number
  name: string | undefined
  identifiers: BoxMonIdentifiers
}

export type OpenHomeBank = {
  index: number
  name: string | undefined
  boxes: OpenHomeBox[]
}

export function getBankName(bank: OpenHomeBank): string {
  return bank.name ?? `Bank ${bank.index + 1}`
}
