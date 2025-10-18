import { useContext, useEffect, useState } from 'react'
import { BackendContext } from '../backend/backendContext'

import Database from '@tauri-apps/plugin-sql'

import { Errorable } from '../types/types'

export type DatabaseManager = { getDatabase: () => Promise<Errorable<StoredDatabase>> } & (
  | {
      loaded: true
      database: StoredDatabase
    }
  | { loaded: false; database: undefined }
)

export function useDatabase() {
  const [databaseCache, setDatabaseCache] = useState<StoredDatabase>()
  const [loading, setLoading] = useState(false)
  const backend = useContext(BackendContext)

  useEffect(() => {
    Database.load('sqlite://assets/Pkm.db').then((db) => {
      db.select('SELECT * FROM form WHERE national_dex = ?', [905]).then((pokedex) =>
        console.log(pokedex)
      )
    })
  }, [])
}

// export const DatabaseContext = createContext<DatabaseManager>([initialState, () => {}])
