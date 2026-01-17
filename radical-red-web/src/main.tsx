import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DarkModeProvider } from './contexts/DarkModeContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </React.StrictMode>,
)
