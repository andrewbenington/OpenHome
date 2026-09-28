import useBackend from '@openhome-core/backend/useBackend'
import { StoredBankData } from '@openhome-core/save/util/storage'
import { R } from '@openhome-core/util/functional'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { Callout } from '@radix-ui/themes'
import { PropsWithChildren, useEffect, useState } from 'react'
import { BanksAndBoxesStoreContext, createBanksAndBoxesStore } from './store'

type InnerProviderProps = {
  initialData: StoredBankData
} & PropsWithChildren

export default function BanksAndBoxesProvider(props: PropsWithChildren) {
  const [error, setError] = useState<string>()
  const backend = useBackend()
  const [initialData, setInitialData] = useState<StoredBankData>()

  useEffect(() => {
    let cancelled = false
    backend.loadHomeBanks().then(
      R.match(
        (banks) => {
          if (!cancelled) setInitialData(banks)
        },
        (err) => {
          if (!cancelled) setError(err)
        }
      )
    )
    return () => {
      cancelled = true
    }
  }, [backend])

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

  if (!initialData) {
    return <LoadingIndicator message="Loading OpenHome boxes..." />
  }

  return <InnerProvider initialData={initialData}>{props.children}</InnerProvider>
}

function InnerProvider({ initialData, children }: InnerProviderProps) {
  const backend = useBackend()
  const [store] = useState(() =>
    createBanksAndBoxesStore(initialData, () => backend.loadHomeBanks())
  )
  return <BanksAndBoxesStoreContext value={store}>{children}</BanksAndBoxesStoreContext>
}
