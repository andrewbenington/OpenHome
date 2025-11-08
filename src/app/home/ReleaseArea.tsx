import { Flex } from '@radix-ui/themes'
import PokemonIcon from 'src/components/PokemonIcon'
import DroppableSpace from 'src/saves/boxes/DroppableSpace'
import { useSaves } from '../../state/saves/useSaves'

export default function ReleaseArea() {
  const savesAndBanks = useSaves()

  return (
    <Flex className="drop-area" direction="column">
      <div className="drop-area-text diagonal-clip">Release</div>
      <DroppableSpace dropID={`to_release`}>
        <div className="release-icon-container" style={{ display: 'flex' }}>
          {savesAndBanks.monsToRelease.map((mon, i) => (
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
