import { createContext, Dispatch, PropsWithChildren, Reducer, useReducer } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { LookupMap } from '../../types/types'

export type LookupState = {
  homeMons?: { [key: string]: OHPKM }
  gen12?: LookupMap
  gen345?: LookupMap
}

export type LookupAction =
  | {
      type: 'load_gen12'
      payload: LookupMap
    }
  | {
      type: 'load_gen345'
      payload: LookupMap
    }

const reducer: Reducer<LookupState, LookupAction> = (state: LookupState, action: LookupAction) => {
  const { type, payload } = action
  switch (type) {
    case 'load_gen12': {
      return {
        ...state,
        gen12: payload,
      }
    }
    case 'load_gen345': {
      return {
        ...state,
        gen345: payload,
      }
    }
  }
}

const initialState: LookupState = {}

export const LookupContext = createContext<[LookupState, Dispatch<LookupAction>]>([
  initialState,
  () => {},
])

export function LookupProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer<Reducer<LookupState, LookupAction>>(reducer, initialState)

  return <LookupContext.Provider value={[state, dispatch]}>{children}</LookupContext.Provider>
}
