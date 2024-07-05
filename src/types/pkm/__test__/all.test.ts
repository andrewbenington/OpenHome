import * as fs from 'fs'
import { isEqual } from 'lodash'
import * as path from 'path'
import { bytesToPKMInterface } from 'pokemon-files'
import { bytesToPKM } from '../FileImport'
import { PKM } from '../PKM'

const dir = path.join(__dirname, './PKMFiles')
const files: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true, recursive: true })

const skipFields = [
  'markings',
  'ribbonBytes',
  'constructor',
  'fileSize',
  'markingCount',
  'markingColors',
  'refreshChecksum',
  'hasPartyData',
  'toPCBytes',
]

files
  .filter((file) => file.isFile())
  .forEach((file: fs.Dirent) => {
    const parts = file.name.split('.')
    if (parts[0] !== '') {
      const extension = parts[parts.length - 1].toUpperCase()
      try {
        console.log(makeBold(file.name))
        const bytes = fs.readFileSync(path.join(file.path, file.name))
        const buffer = new Uint8Array(bytes).buffer
        const iface = bytesToPKMInterface(buffer, extension)
        const cls = bytesToPKM(new Uint8Array(bytes), extension)
        compareClassToInterface(cls, iface)
        console.log(makeBold(file.name) + ' to bytes')
        compareClassToInterface(cls, bytesToPKMInterface(iface.toBytes(), extension))
      } catch (e) {
        console.log(`${file.name}: ${e}`)
      }
      console.log()
    }
  })

function compareClassToInterface(cls: PKM, iface: any) {
  console.log(cls.nickname, iface.nickname)
  const fields = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(cls)))
  for (const field of Object.keys(iface)) {
    fields.add(field)
  }

  for (const field of fields) {
    if (skipFields.includes(field)) continue
    const value = iface[field]

    if (typeof value === 'object') {
      if (!isEqual(cls[field], value)) {
        if (typeof value === 'object') {
          console.log(
            `\t${makeBold(field)}: new ${makeRed(JSON.stringify(value))} != old ${makeRed(
              JSON.stringify(cls[field])
            )}`
          )
        }
      }
    } else if (typeof value === 'number') {
      if (value !== cls[field]) {
        console.log(
          `\t${makeBold(field)}: new ${makeRed(
            `${value} (0x${value.toString(16)})`
          )} != old ${makeRed(`${cls[field]} (0x${cls[field]?.toString(16)})`)}`
        )
      }
    } else if (cls[field] !== value) {
      console.log(`\t${makeBold(field)}: new ${makeRed(value)} != old ${makeRed(cls[field])}`)
    }
  }
}

function makeRed(s: any) {
  return `\x1b[31m${s}\x1b[0m`
}

function makeBold(s: any) {
  return `\x1b[1m${s}\x1b[0m`
}
