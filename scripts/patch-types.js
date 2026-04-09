import { readFileSync, writeFileSync } from 'fs'

const path = 'pkm_rs/pkg/pkm_rs.d.ts'
const content = readFileSync(path, 'utf8')
const patched = content.replace(/.*supportedGameOrigins\([^)]*\): any\[\];\n/, '')
writeFileSync(path, patched)
