export type PathData = {
  raw: string
  name: string
  dir: string
  ext: string
  separator: string
}

export const emptyPathData: PathData = {
  raw: '',
  dir: '',
  name: '',
  separator: '/',
  ext: '',
}

export function splitPath(path: PathData) {
  return [...path.dir.split(path.separator).filter((seg) => seg !== ''), path.name]
}

export type PossibleSaves = {
  citra?: PathData[]
  desamume?: PathData[]
  open_emu?: PathData[]
}
