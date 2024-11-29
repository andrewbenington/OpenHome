import { invoke } from '@tauri-apps/api/core'
import * as E from 'fp-ts/lib/Either'
import { useState } from 'react'
import './App.css'
import { TauriInvoker } from './backend/tauri/tauriInvoker'
import { TauriBackend } from './backend/tauriBackend'
import { DevDataDisplay } from './components/DevDataDisplay'
import { JSONObject } from './types/types'

function App() {
  const [greetMsg, setGreetMsg] = useState('')
  const [data, setData] = useState<JSONObject>()
  const [path, setPath] = useState<string[]>([])

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    invoke('get_storage_file_json', { pathElems: path })
      .then((val) => {
        console.log(val)
        setGreetMsg(JSON.stringify(val))
      })
      .catch((err) => setGreetMsg(`Error: ${err}`))
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/logos/Black_2.png" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>
      <DevDataDisplay data={data} />

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          greet()
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setPath(e.currentTarget.value.split(' '))}
          placeholder="Enter a file..."
        />
        <button type="submit">Get</button>
      </form>
      <button onClick={() => TauriBackend.loadHomeMonLookup().then(console.info)}>OHPKMs</button>
      <button
        onClick={() =>
          TauriInvoker.writeStorageFileJSON('test.json', {
            hee: ['hoo', 3],
            another: null,
          })
            .then(() => setGreetMsg('Success'))
            .catch((err) => setGreetMsg(`Error: ${err}`))
        }
      >
        Write File
      </button>
      <button
        onClick={() =>
          TauriInvoker.deleteStorageFiles([
            'folder/hello.txt',
            'folder/goodbye',
            'folder/sehfsue',
            'test.json',
          ]).then((result) => {
            if (E.isRight(result)) {
              const fileErrors = Object.entries(result.right).filter(([, fileResult]) =>
                E.isLeft(fileResult)
              ) as [string, E.Left<string>][]
              for (const [file, error] of fileErrors) {
                console.error(`Could not delete ${file}: ${error.left}`)
              }
            }
          })
        }
      >
        Delete Files From Folder
      </button>
      <button
        onClick={() =>
          TauriInvoker.writeStorageFileBytes('test.txt', new Uint8Array([71, 65, 89])).then(
            console.log
          )
        }
      >
        Write file bytes
      </button>
      <button
        onClick={() =>
          TauriInvoker.getFileBytes(
            '/Users/andrewbenington/Library/Application Support/OpenHome/storage/test.txt'
          ).then(console.log)
        }
      >
        Read file bytes
      </button>
      <button
        onClick={() =>
          TauriBackend.getRecentSaves().then(
            E.match(console.error, (d) => setData(d as JSONObject))
          )
        }
      >
        Recent Saves
      </button>
      <button onClick={() => TauriBackend.pickFolder().then(E.match(console.error, setGreetMsg))}>
        Open Directory
      </button>
      <p>{greetMsg}</p>
    </main>
  )
}

export default App
