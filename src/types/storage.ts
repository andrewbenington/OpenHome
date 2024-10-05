export type SaveFolder = {
  path: string
  label?: string
}

export type BoxMonIdentifiers = Record<number, string>

export type StoredBoxData = {
  index: number
  name: string
  monIdentifiersByIndex: BoxMonIdentifiers
}
