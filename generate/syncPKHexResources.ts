import fs from 'fs'
import https from 'https'
import { dirname } from 'path'
import { StringDecoder } from 'string_decoder'
import YAML from 'yaml'
import { ResourcesDir } from './consts'

interface Resource {
  source: string
  dest: string
  replaceExisting: boolean
}

interface Config {
  resources: Resource[]
  forceReplaceExisting: boolean
}

const downloadTextResource = (source: string, dest: string) => {
  const fullDest = `${process.cwd()}/${ResourcesDir}/${dest}`

  if (!fs.existsSync(dirname(fullDest))) {
    console.log(`creating ${dirname(fullDest)}...`)
    fs.mkdirSync(dirname(fullDest), { recursive: true })
  }

  console.log(`downloading ${source} -> ${dest}`)

  const rawURL = `https://raw.githubusercontent.com/kwsch/PKHeX/master/PKHeX.Core/Resources/text/${source}`
  const file = fs.openSync(fullDest, 'w')
  https.get(rawURL, (response) => {
    let decoder: StringDecoder

    response.on('data', (chunk: Buffer) => {
      let data = chunk
      // some files are utf 16
      if (decoder === undefined) {
        if (chunk[0] === 0xff && chunk[1] === 0xfe) {
          decoder = new StringDecoder('utf16le')
          data = chunk.subarray(2)
        } else {
          decoder = new StringDecoder('utf8')
        }
      }
      fs.writeSync(file, decoder.write(data))
    })
    response.on('finish', () => {
      fs.closeSync(file)
    })
  })
}

const configFile = fs.readFileSync(
  `${process.cwd()}/generate/sync.yaml`,
  'utf-8'
)
const config: Config = YAML.parse(configFile, {
  prettyErrors: true,
})

config.resources.forEach((r) => {
  if (
    config.forceReplaceExisting ||
    r.replaceExisting ||
    !fs.existsSync(`${process.cwd()}/${ResourcesDir}/${r.dest}`)
  )
    downloadTextResource(r.source, r.dest)
})
