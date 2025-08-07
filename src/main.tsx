import init from '@pokemon-wasm/pkm_rs'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'

init()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
