import '@radix-ui/themes/styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import init from '../pkm_rs/pkg'
import { doNecessaryPolyfills } from './core/util/polyfill'
import App from './ui/App'

doNecessaryPolyfills()

await init()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
