import { BackendContext } from '@openhome-core/backend/backendContext'
import { StoredBankData } from '@openhome-core/save/util/storage'
import { R } from '@openhome-core/util/functional'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { Callout } from '@radix-ui/themes'
import { PropsWithChildren, useCallback, useContext, useState } from 'react'
import { BanksAndBoxesStoreContext, createBanksAndBoxesStore } from './store'

type InnerProviderProps = {
  storedBanksAndBoxes: StoredBankData
  loadAllHomeData: () => Promise<void>
} & PropsWithChildren

export default function BanksAndBoxesProvider(props: PropsWithChildren) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useContext(BackendContext)
  const [storedBanksAndBoxes, setStoredBanksAndBoxes] = useState<StoredBankData>()

  const loadAllHomeData = useCallback(async () => {
    if (error) return

    setLoading(true)
    await backend.loadHomeBanks().then(
      R.match(
        (banks) => setStoredBanksAndBoxes(banks),
        (err) => setError(err)
      )
    )

    setLoading(false)
  }, [backend, error])

  if (error) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <ErrorIcon />
        </Callout.Icon>
        <Callout.Text>{error}</Callout.Text>
      </Callout.Root>
    )
  }

  if (!storedBanksAndBoxes) {
    if (!loading) {
      loadAllHomeData()
    }
    return <LoadingIndicator message="Loading OpenHome boxes..." />
  }

  return (
    <InnerProvider storedBanksAndBoxes={storedBanksAndBoxes} loadAllHomeData={loadAllHomeData}>
      {props.children}
    </InnerProvider>
  )
}

function InnerProvider({ storedBanksAndBoxes, loadAllHomeData, children }: InnerProviderProps) {
  const [store] = useState(() => createBanksAndBoxesStore(storedBanksAndBoxes, loadAllHomeData))
  return <BanksAndBoxesStoreContext value={store}>{children}</BanksAndBoxesStoreContext>
}
