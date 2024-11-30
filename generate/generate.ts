/* eslint-disable global-require */
import fs from 'fs'
import YAML from 'yaml'
import { GenerateEnumFromTextFile } from './enums'

interface EnumConfig {
  name: string
  source: string
  dest: string
  getKeyAndStr?: string
}

interface Config {
  enums: EnumConfig[]
}

const configFile = fs.readFileSync(`./generate/gen.yaml`, 'utf-8')
const config: Config = YAML.parse(configFile, {
  prettyErrors: true,
})

config.enums.forEach((e) => {
  let getKeyAndStr: ((line: string) => { key: string; str: string }) | undefined
  if (e.getKeyAndStr) {
    getKeyAndStr = require(`./parseFunctions/ribbons`).parseFunction
    if (!getKeyAndStr) {
      getKeyAndStr = () => ({ key: 'uh', str: 'oh' })
    }
  }
  GenerateEnumFromTextFile(e.name, e.source, e.dest, getKeyAndStr)
})
