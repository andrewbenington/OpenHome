import { Dispatch, useContext } from 'react'
import { SAV } from '../../types/SAVTypes/SAV'
import { OpenSavesAction, OpenSavesState, SavesContext } from './reducer'

export type SavesState = Required<Omit<OpenSavesState, 'error'>>

export function useSaves(): [SavesState, Dispatch<OpenSavesAction>, SAV[]] {
  const [openSavesState, openSavesDispatch, allOpenSaves] = useContext(SavesContext)

  if (openSavesState.error) {
    throw new Error(`Error loading saves state: ${openSavesState.error}`)
  }

  const homeData = openSavesState.homeData
  if (!homeData) {
    throw new Error(
      `Home Data not present. useSaves() must not be called in a component that is not descended from a SavesProvider.`
    )
  }

  return [{ ...openSavesState, homeData }, openSavesDispatch, allOpenSaves]
}
