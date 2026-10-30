import '@radix-ui/themes/styles.css'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { enableMapSet } from 'immer'
import init, { InitOutput } from '../pkm_rs/pkg'
import { addMissingFunctions } from './polyfill'

export let PKM_RS_WASM: InitOutput
let initCount = 0

export async function initializeApp() {
  console.log('wasm init', ++initCount, new Error().stack)
  addMissingFunctions()
  enableMapSet()

  PKM_RS_WASM = await init()

  dayjs.extend(localizedFormat)
}
