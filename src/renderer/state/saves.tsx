import { createContext, Dispatch, PropsWithChildren, Reducer, useReducer } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { PKMFile } from 'src/types/pkm/util'
import { SAV } from 'src/types/SAVTypes'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { StoredBoxData } from 'src/types/storage'
import { SaveType } from 'src/types/types'

export type OpenSave = {
  index: number
  save: SAV
}

export type OpenSaveIdentifier = `${number}$${number}$${number}`

function saveToStringIdentifier(save: SAV): OpenSaveIdentifier {
  return `${save.origin}$${save.tid}$${save.sid ?? 0}`
}

export type OpenSavesState = {
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToRelease: PKMFile[]
  openSaves: Partial<Record<OpenSaveIdentifier, OpenSave>>
  homeData?: HomeData
  error?: string
}

export type OpenSavesAction =
  | {
      type: 'set_home_boxes'
      payload: {
        boxes: StoredBoxData[]
        homeLookup: Record<string, OHPKM>
      }
    }
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
  | {
      type: 'set_error'
      payload: string | undefined
    }

const reducer: Reducer<OpenSavesState, OpenSavesAction> = (
  state: OpenSavesState,
  action: OpenSavesAction
) => {
  const { type, payload } = action
  switch (type) {
    case 'set_home_boxes': {
      const { boxes, homeLookup } = payload
      console.log(boxes, homeLookup)
      const newHomeData = new HomeData()
      Object.values(boxes).forEach((box) => {
        newHomeData.boxes[box.index].loadMonsFromIdentifiers(box.monIdentifiersByIndex, homeLookup)
      })
      return { ...state, homeData: newHomeData }
    }
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
    case 'set_error': {
      return {
        ...state,
        error: payload,
      }
    }
  }
}

const initialState: OpenSavesState = {
  modifiedOHPKMs: {},
  monsToRelease: [],
  openSaves: {},
}

export const OpenSavesContext = createContext<[OpenSavesState, Dispatch<OpenSavesAction>, SAV[]]>([
  initialState,
  () => {},
  [],
])

export function OpenSavesProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer<Reducer<OpenSavesState, OpenSavesAction>>(
    reducer,
    initialState
  )

  return (
    <OpenSavesContext.Provider
      value={[
        state,
        dispatch,
        Object.values(state.openSaves)
          .filter((data) => !!data)
          .filter((data) => data.save.saveType !== SaveType.OPENHOME)
          .sort((a, b) => a.index - b.index)
          .map((data) => data.save),
      ]}
    >
      {children}
    </OpenSavesContext.Provider>
  )
}
