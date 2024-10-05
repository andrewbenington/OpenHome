export type ParsedPath = {
  raw: string
  base: string
  name: string
  dir: string
  ext: string
  root: string
  separator: '\\' | '/'
}

export const emptyParsedPath: ParsedPath = {
  raw: '',
  base: '',
  dir: '',
  name: '',
  separator: '/',
  ext: '',
  root: '',
}

export function joinPath(path: ParsedPath) {
  return [path.dir, path.name].join(path.separator) + path.ext
}

export function splitPath(path: ParsedPath) {
  return [path.root, ...path.dir.split(path.separator).filter((seg) => seg !== ''), path.name]
}

export type PossibleSaves = {
  citra: ParsedPath[]
  desamume: ParsedPath[]
  openEmu: ParsedPath[]
}
