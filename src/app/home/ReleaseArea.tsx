import { Flex } from '@radix-ui/themes'
import { useContext } from 'react'
import PokemonIcon from 'src/components/PokemonIcon'
import DroppableSpace from 'src/saves/boxes/DroppableSpace'
import { OpenSavesContext } from 'src/state/openSaves'

export default function ReleaseArea() {
  const [openSavesState] = useContext(OpenSavesContext)

  return (
    <Flex className="drop-area" direction="column">
      <div className="drop-area-text diagonal-clip">Release</div>
      <DroppableSpace dropID={`to_release`}>
        <div className="release-icon-container" style={{ display: 'flex' }}>
          {openSavesState.monsToRelease.map((mon, i) => {
            return (
              <PokemonIcon
                key={`delete_mon_${i}`}
                dexNumber={mon.dexNum}
                formeNumber={mon.formeNum}
                style={{ height: 32, width: 32 }}
              />
            )
          })}
        </div>
      </DroppableSpace>
    </Flex>
  )
}
