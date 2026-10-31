import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { Callout, Flex } from '@radix-ui/themes'
// import { TauriBackend } from '@openhome-core/tauri/backend'
import useBackend from '@openhome-core/backend/useBackend'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useCallback,
  useContext,
  useReducer,
  useState,
} from 'react'
import { ItemBagAction, itemBagReducer, ItemBagState } from './reducer'

type ItemBag = Record<string, number>
const BAG_KEY = ['ITEM_BAG'] as const

// remote state fetching layer
export function ItemBagProvider({ children }: PropsWithChildren) {
  const backend = useBackend()
  const { data, isPending, error } = useQuery({
    queryKey: BAG_KEY,
    queryFn: backend.loadItemBag,
  })

  if (error) {
    return (
      <Flex width="100%" p="2" align="center" justify="center">
        <Callout.Root variant="soft" style={{ width: '100%', fontSize: 24 }}>
          <Callout.Icon>
            <ErrorIcon />
          </Callout.Icon>
          <Callout.Text>{error.name}</Callout.Text>
          <Callout.Text>{error.message}</Callout.Text>
        </Callout.Root>
      </Flex>
    )
  }

  if (isPending) {
    return <LoadingIndicator message="Loading app state..." />
  }

  return <LoadedLocalStateProvider data={data}>{children}</LoadedLocalStateProvider>
}

type LoadedBagProviderProps = PropsWithChildren & {
  data: ItemBag
}

type LoadedLocalStateController = {
  state: ItemBagState
  dispatch: Dispatch<ItemBagAction>
}

// reducer layer, always provided with a loaded bag state
function LoadedLocalStateProvider(props: LoadedBagProviderProps) {
  const { data, children } = props
  const [state, dispatch] = useReducer(itemBagReducer, {
    itemCounts: data,
    modified: false,
  })
  return <LoadedLocalStateContext value={{ state, dispatch }}>{children}</LoadedLocalStateContext>
}

const initialBagState: ItemBagState = { itemCounts: {}, modified: false }

/*
 *  CONTEXT
 */
export const LoadedLocalStateContext = createContext<LoadedLocalStateController>({
  state: initialBagState,
  dispatch: () => {},
})

// hook exposing item bag API to the rest of the app
export function useItemBag() {
  const queryClient = useQueryClient()
  const backend = useBackend()
  const { state, dispatch } = useContext(LoadedLocalStateContext)
  const [loading, setLoading] = useState(false)

  const refetchStoredBag = useCallback(async () => {
    setLoading(true)
    const response = await queryClient.query({
      queryKey: BAG_KEY,
      queryFn: backend.loadItemBag,
      staleTime: 0,
    })

    dispatch({ type: 'load_item_bag', payload: response })
    setLoading(false)
  }, [queryClient, dispatch, backend])

  function addItem(index: number, quantity: number) {
    dispatch({ type: 'add_item', payload: { index, qty: quantity } })
  }

  function removeItem(index: number, quantity: number) {
    dispatch({ type: 'remove_item', payload: { index, qty: quantity } })
  }

  return { ...state, addItem, removeItem, refetchStoredBag, loading }
}

export type ItemBagController = ReturnType<typeof useItemBag>
