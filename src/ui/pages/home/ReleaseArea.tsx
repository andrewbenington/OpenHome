import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import DroppableSpace from '@openhome-ui/saves/boxes/DroppableSpace'
import { useSaves } from '@openhome-ui/state/saves'
import { Flex } from '@radix-ui/themes'
import { useMemo } from 'react'
import { filterUndefined } from '../../../core/util/sort'
import { useOhpkmStore } from '../../state/ohpkm'

export default function ReleaseArea() {
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()

  const mons = useMemo(
    () =>
      savesAndBanks.monsToRelease
        .map((monOrIdentifier) =>
          typeof monOrIdentifier === 'string'
            ? ohpkmStore.getById(monOrIdentifier)
            : monOrIdentifier
        )
        .filter(filterUndefined),
    [ohpkmStore, savesAndBanks.monsToRelease]
  )

  return (
    <Flex className="drop-area" direction="column">
      <div className="drop-area-text diagonal-clip">Release</div>
      <DroppableSpace dropID={`to_release`}>
        <div className="release-icon-container" style={{ display: 'flex' }}>
          {mons.map((mon, i) => (
            <PokemonIcon
              key={`delete_mon_${i}`}
              dexNumber={mon.dexNum}
              formeNumber={mon.formeNum}
              style={{ height: 32, width: 32 }}
            />
          ))}
        </div>
      </DroppableSpace>
    </Flex>
  )
}
