import React from 'react'
import 'react-data-grid/lib/styles.css'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
