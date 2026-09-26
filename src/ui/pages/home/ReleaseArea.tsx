import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { $R, isResult } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import MissingOhpkmIdPrompt from '@openhome-ui/pokemon/MissingOhpkmId'
import { useMissingOhpkmId } from '@openhome-ui/pokemon/useMissingOhpkmId'
import DroppableSpace from '@openhome-ui/saves/boxes/DroppableSpace'
import useOhpkmIdBatchLookup from '@openhome-ui/state/ohpkm/useOhpkmIdBatchLookup'
import { useSaves } from '@openhome-ui/state/saves'
import { Flex, Spinner } from '@radix-ui/themes'
import { OhpkmLookupResult } from '../../state/ohpkm'

export type MonsToReleaseState = {
  loading: boolean
  loadedMons: (PKMInterface | OhpkmLookupResult)[]
}

function useMonsToRelease(): MonsToReleaseState {
  const savesAndBanks = useSaves()

  const saveMons = savesAndBanks.monsToRelease.filter((monOrId) => typeof monOrId !== 'string')
  const openhomeIds = savesAndBanks.monsToRelease.filter((monOrId) => typeof monOrId === 'string')
  const { loading, batchResults } = useOhpkmIdBatchLookup(openhomeIds)

  const lookupResults = batchResults?.values() ?? []

  return {
    loading,
    loadedMons: [...lookupResults, ...saveMons],
  }
}

export default function ReleaseArea() {
  const { loading, loadedMons } = useMonsToRelease()
  const missingIdController = useMissingOhpkmId()

  return (
    <Flex className="drop-area" direction="column">
      <div className="drop-area-text diagonal-clip">Release</div>
      <DroppableSpace dropID={`to_release`}>
        <div className="release-icon-container" style={{ display: 'flex' }}>
          {loadedMons && !loading ? (
            loadedMons.map((mon) =>
              !isResult(mon) ? (
                <PokemonIcon
                  key={uniqueishMonKey(mon)}
                  nationalDex={mon.nationalDex}
                  formIndex={mon.formIndex}
                  style={{ height: '2rem', width: '2rem' }}
                />
              ) : (
                $R(mon).match(
                  (ohpkm) => (
                    <PokemonIcon
                      key={ohpkm.openhomeId}
                      nationalDex={ohpkm.nationalDex}
                      formIndex={ohpkm.formIndex}
                      style={{ height: '2rem', width: '2rem' }}
                    />
                  ),
                  ({ identifier }) => (
                    <MissingOhpkmIdPrompt
                      controller={missingIdController}
                      context={null}
                      openhomeId={identifier}
                    />
                  )
                )
              )
            )
          ) : (
            <Spinner />
          )}
        </div>
      </DroppableSpace>
    </Flex>
  )
}

function uniqueishMonKey(mon: PKMInterface): string {
  return `${mon.encryptionConstant ?? mon.personalityValue ?? JSON.stringify(mon.dvs)}-${mon.nickname}`
}
