export type PathData = {
  raw: string
  base: string
  name: string
  dir: string
  ext: string
  root: string
  separator: '\\' | '/'
}

export const emptyPathData: PathData = {
  raw: '',
  base: '',
  dir: '',
  name: '',
  separator: '/',
  ext: '',
  root: '',
}

export function joinPath(path: PathData) {
  return [path.dir, path.name].join(path.separator) + path.ext
}

export function splitPath(path: PathData) {
  return [path.root, ...path.dir.split(path.separator).filter((seg) => seg !== ''), path.name]
}

export type PossibleSaves = {
  citra?: PathData[]
  desamume?: PathData[]
  openEmu?: PathData[]
}
