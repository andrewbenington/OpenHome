import '@radix-ui/themes/styles.css'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { enableMapSet } from 'immer'
import init, { InitOutput } from '../pkm_rs/pkg'
import { addMissingFunctions } from './polyfill'

export let PKM_RS_WASM: InitOutput

export async function initializeApp() {
  console.log("initializing app")
  addMissingFunctions()
  enableMapSet()

  console.log("initializing wasm")
  PKM_RS_WASM = await init()
  console.log("wasm initialized")

  dayjs.extend(localizedFormat)
}
