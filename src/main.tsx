import '@radix-ui/themes/styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import init from '../pkm_rs/pkg'
import App from './ui/App'

await init()

window.addEventListener('unload', function (e) {
  console.log('WINDOW UNLOADED')
})
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
