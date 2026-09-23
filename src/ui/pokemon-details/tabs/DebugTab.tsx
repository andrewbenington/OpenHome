import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option } from '@openhome-core/util/functional'
import AttributeRow from '@openhome-ui/components/AttributeRow'

import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { Flex, Spinner } from '@radix-ui/themes'
import { Suspense, use } from 'react'

const DebugTab = (props: { mon: PKMInterface }) => {
  const { mon } = props

  const ohpkmStore = useOhpkmStore()
  const monIdIfTracked = ohpkmStore.getIdIfTracked(mon)

  return (
    <Suspense fallback={<Spinner />}>
      <DebugTabInner mon={mon} idIfTrackedPromise={monIdIfTracked} />
    </Suspense>
  )
}

type DebugTabInnerProps = {
  mon: PKMInterface
  idIfTrackedPromise: Promise<Option<OhpkmIdentifier>>
}

const DebugTabInner = (props: DebugTabInnerProps) => {
  const { mon, idIfTrackedPromise } = props
  const ohpkmStore = useOhpkmStore()

  const monIdIfTracked = use(idIfTrackedPromise)
  const potentialId = ohpkmStore.getPotentialOhpkmId(mon)

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <Flex
        direction="column"
        gap="2px"
        style={{
          height: '100%',
          padding: 8,
          overflowY: 'auto',
        }}
      >
        <AttributeRow label="OHPKM ID (if tracked)">
          <code>{monIdIfTracked}</code>
        </AttributeRow>
        <AttributeRow label="Hypothetical OHPKM ID">
          <code>{potentialId}</code>
        </AttributeRow>
      </Flex>
    </div>
  )
}

export default DebugTab
