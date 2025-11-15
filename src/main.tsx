import '@radix-ui/themes/styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import pkmRsInit from '../pkm_rs/pkg'
import init from '../pkm_rs_resources/pkg'
import App from './app/App'

await init()
await pkmRsInit()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
