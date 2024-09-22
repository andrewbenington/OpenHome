import { createContext, Dispatch, PropsWithChildren, Reducer, useReducer } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { PKMFile } from 'src/types/pkm/util'
import { SAV } from 'src/types/SAVTypes'
import { SaveType } from 'src/types/types'

export type OpenSave = {
  index: number
  save: SAV
}

export type OpenSaveIdentifier = 'OPENHOME' | `${number}$${number}$${number}`

function saveToStringIdentifier(save: SAV): OpenSaveIdentifier {
  if (save.saveType === SaveType.OPENHOME) {
    return 'OPENHOME'
  }
  return `${save.origin}$${save.tid}$${save.sid ?? 0}`
}

export type OpenSavesState = {
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToRelease: PKMFile[]
  openSaves: Partial<Record<OpenSaveIdentifier, OpenSave>>
}

export type OpenSavesAction =
  | {
      type: 'add_save'
      payload: {
        save: SAV
      }
    }
  | {
      type: 'remove_save'
      payload: {
        save: SAV
      }
    }
  | {
      type: 'clear_all'
      payload?: undefined
    }

const reducer: Reducer<OpenSavesState, OpenSavesAction> = (
  state: OpenSavesState,
  action: OpenSavesAction
) => {
  const { type, payload } = action
  switch (type) {
    case 'add_save': {
      const saveIdentifier = saveToStringIdentifier(payload.save)
      return {
        ...state,
        opemSaves: { ...state.openSaves, [saveIdentifier]: payload.save },
      }
    }
    case 'remove_save': {
      delete state.openSaves[saveToStringIdentifier(payload.save)]

      return { ...state, opemSaves: { ...state.openSaves } }
    }
    case 'clear_all': {
      return { ...state, opemSaves: {} }
    }
  }
}

const initialState: OpenSavesState = { modifiedOHPKMs: {}, monsToRelease: [], openSaves: {} }

export const OpenSavesContext = createContext<[OpenSavesState, Dispatch<OpenSavesAction>]>([
  initialState,
  () => {},
])

export function OpenSavesProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer<Reducer<OpenSavesState, OpenSavesAction>>(
    reducer,
    initialState
  )

  return <OpenSavesContext.Provider value={[state, dispatch]}>{children}</OpenSavesContext.Provider>
}
