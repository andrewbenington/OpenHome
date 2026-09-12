import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { Option } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import DroppableSpace from '@openhome-ui/saves/boxes/DroppableSpace'
import { useSaves } from '@openhome-ui/state/saves'
import { Flex, Spinner } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { useOhpkmStore } from '../../state/ohpkm'

export type MonsToReleaseState =
  | {
      loading: boolean
      loadedMons: undefined
      loadMons: () => Promise<void>
    }
  | {
      loading: false
      loadedMons: PKMInterface[]
      loadMons: () => Promise<void>
    }

function useMonsToRelease(): MonsToReleaseState {
  const [loading, setLoading] = useState(false)
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()
  const [loadedMons, setLoadedMons] = useState<Option<PKMInterface[]>>()

  async function loadMons() {
    if (!loading && !loadedMons) {
      setLoading(true)

      const mons: PKMInterface[] = await Promise.all(
        savesAndBanks.monsToRelease.map((monOrIdentifier) =>
          typeof monOrIdentifier === 'string'
            ? ohpkmStore.getById(monOrIdentifier)
            : Promise.resolve(monOrIdentifier)
        )
      ).then((mons) => mons.filter(filterUndefined))
      setLoadedMons(mons)

      setLoading(false)
    }
  }

  return loading
    ? {
        loading,
        loadedMons: undefined,
        loadMons,
      }
    : {
        loading,
        loadedMons: loadedMons ?? [],
        loadMons,
      }
}

export default function ReleaseArea() {
  const { loading, loadedMons, loadMons } = useMonsToRelease()

  useEffect(() => {
    if (!loading && !loadedMons) {
      loadMons()
    }
  }, [loadMons, loadedMons, loading])

  return (
    <Flex className="drop-area" direction="column">
      <div className="drop-area-text diagonal-clip">Release</div>
      <DroppableSpace dropID={`to_release`}>
        <div className="release-icon-container" style={{ display: 'flex' }}>
          {loadedMons && !loading ? (
            loadedMons.map((mon, i) => (
              <PokemonIcon
                key={`delete_mon_${i}`}
                nationalDex={mon.nationalDex}
                formIndex={mon.formIndex}
                style={{ height: 32, width: 32 }}
              />
            ))
          ) : (
            <Spinner />
          )}
        </div>
      </DroppableSpace>
    </Flex>
  )
}
