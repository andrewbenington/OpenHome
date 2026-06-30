import { StoredBankData } from '@openhome-core/save/util/storage'
import { R } from '@openhome-core/util/functional'
import { AppBackend } from '@openhome-ui/backend'
import { Callout } from '@radix-ui/themes'
import { PropsWithChildren, useCallback, useState } from 'react'
import { ErrorIcon } from '../../components/Icons'
import LoadingIndicator from '../../components/LoadingIndicator'
import { BanksAndBoxesStoreContext, createBanksAndBoxesStore } from './store'

type InnerProviderProps = {
  storedBanksAndBoxes: StoredBankData
  loadAllHomeData: () => Promise<void>
} & PropsWithChildren

export default function BanksAndBoxesProvider(props: PropsWithChildren) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [storedBanksAndBoxes, setStoredBanksAndBoxes] = useState<StoredBankData>()

  const loadAllHomeData = useCallback(async () => {
    if (error) return

    setLoading(true)
    await AppBackend.loadHomeBanks().then(
      R.match(
        (banks) => setStoredBanksAndBoxes(banks),
        (err) => setError(err)
      )
    )

    setLoading(false)
  }, [error])

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
