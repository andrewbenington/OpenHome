// DEBUG: Use dynamic imports to isolate which import is failing
const dbg = (window as any).__debugLog || console.log

dbg('[INIT] main.tsx executing...')

try {
  dbg('[INIT] importing @radix-ui/themes/styles.css...')
  await import('@radix-ui/themes/styles.css')
  dbg('[INIT] OK')
} catch (e: any) {
  dbg('[INIT] FAIL @radix-ui/themes/styles.css: ' + (e?.stack || e))
}

let React: any
try {
  dbg('[INIT] importing react...')
  React = (await import('react')).default
  dbg('[INIT] OK')
} catch (e: any) {
  dbg('[INIT] FAIL react: ' + (e?.stack || e))
}

let ReactDOM: any
try {
  dbg('[INIT] importing react-dom/client...')
  ReactDOM = await import('react-dom/client')
  dbg('[INIT] OK')
} catch (e: any) {
  dbg('[INIT] FAIL react-dom/client: ' + (e?.stack || e))
}

let BrowserRouter: any
try {
  dbg('[INIT] importing react-router...')
  BrowserRouter = (await import('react-router')).BrowserRouter
  dbg('[INIT] OK')
} catch (e: any) {
  dbg('[INIT] FAIL react-router: ' + (e?.stack || e))
}

let init: any
try {
  dbg('[INIT] importing pkm_rs/pkg (WASM)...')
  init = (await import('../pkm_rs/pkg')).default
  dbg('[INIT] OK')
} catch (e: any) {
  dbg('[INIT] FAIL pkm_rs/pkg: ' + (e?.stack || e))
}

let App: any
try {
  dbg('[INIT] importing ./ui/App...')
  App = (await import('./ui/App')).default
  dbg('[INIT] OK')
} catch (e: any) {
  dbg('[INIT] FAIL ./ui/App: ' + (e?.stack || e))
}

if (init) {
  try {
    dbg('[INIT] Running WASM init()...')
    await init()
    dbg('[INIT] WASM init complete')
  } catch (e: any) {
    dbg('[INIT] WASM init FAILED: ' + (e?.stack || e))
  }
}

if (ReactDOM && React && BrowserRouter && App) {
  dbg('[INIT] Mounting React app...')
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
  dbg('[INIT] React mounted')
} else {
  dbg('[INIT] Cannot mount - missing dependencies')
}
