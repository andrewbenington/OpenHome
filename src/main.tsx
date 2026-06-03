import '@radix-ui/themes/styles.css'
import { enableMapSet } from 'immer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import init from '../pkm_rs/pkg'
import App from './ui/App'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

await init()
enableMapSet()

dayjs.extend(localizedFormat)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
