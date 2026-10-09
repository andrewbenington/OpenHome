import '@radix-ui/themes/styles.css'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { enableMapSet } from 'immer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import init from '../pkm_rs/pkg'
import { addMissingFunctions } from './polyfill'
import App from './ui/App'

addMissingFunctions()

const PKM_RS_WASM = await init()

enableMapSet()

dayjs.extend(localizedFormat)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App pkmRsWasm={PKM_RS_WASM} />
    </BrowserRouter>
  </React.StrictMode>
)
