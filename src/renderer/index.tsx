import React, { Profiler } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './app/App'
import './index.css'
import { store } from './redux/store'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Profiler
      id="profiler-test"
      onRender={(...args) => {
        const { 1: phase, 2: actualDuration } = args

        console.log({ phase, actualDuration })
      }}
    >
      <Provider store={store}>
        <App />
      </Provider>
    </Profiler>
  </React.StrictMode>
)
