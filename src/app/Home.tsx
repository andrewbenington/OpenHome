import { bytesToPKMInterface } from '@pokemon-files/pkm'
import { Badge, Button, Card, Flex, Tabs } from '@radix-ui/themes'
import lodash from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdFileOpen } from 'react-icons/md'
import PokemonDetailsModal from 'src/pokemon/PokemonDetailsModal'
import BankHeader from 'src/saves/BankHeader'
import ItemBag from 'src/saves/ItemBag'
import { CSSWithVariables } from 'src/types/types'
import { BackendContext } from '../backend/backendContext'
import FilterPanel from '../components/filter/FilterPanel'
import useDisplayError from '../hooks/displayError'
import HomeBoxDisplay from '../saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '../saves/boxes/SaveBoxDisplay'
import SavesModal from '../saves/SavesModal'
import { useSaves } from '../state/saves/useSaves'
import { PKMInterface } from '../types/interfaces'
import { OHPKM } from '../types/pkm/OHPKM'
import './Home.css'
import ReleaseArea from './home/ReleaseArea'

const Home = () => {
  const backend = useContext(BackendContext)
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [, , allOpenSaves] = useSaves()
  const displayError = useDisplayError()

  useEffect(() => {
    // returns a function to stop listening
    const stopListening = backend.registerListeners({
      onOpen: () => setOpenSaveDialog(true),
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend])

  const previewFile = useCallback(
    async (file: File) => {
      let mon: PKMInterface | undefined

      if (file) {
        const buffer = await file.arrayBuffer()
        const [extension] = file.name.split('.').slice(-1)

        try {
          if (extension.toUpperCase() === 'OHPKM') {
            mon = new OHPKM(new Uint8Array(buffer))
          } else {
            mon = bytesToPKMInterface(buffer, extension.toUpperCase())
          }
        } catch (e) {
          displayError('Import Error', `Could not read Pokémon file: ${e}`)
        }
      }
      if (!mon) {
        displayError('Import Error', 'Not a valid Pokémon file format')
        return
      }
      setSelectedMon(mon)
    },
    [displayError]
  )

  const tabStyle: CSSWithVariables = {
    '--tab-padding-x': '6px',
    '--tab-inner-padding-y': '2px',
    '--tab-height': '32px',
  }

  return (
    <Flex direction="row" style={{ height: '100%' }}>
      <Flex className="save-file-column" gap="3">
        {lodash.range(allOpenSaves.length).map((i) => (
          <OpenSaveDisplay key={`save_display_${i}`} saveIndex={i} />
        ))}
        <Button onClick={() => setOpenSaveDialog(true)}>
          <MdFileOpen />
          Open Save
        </Button>
      </Flex>
      <div className="home-box-column">
        <BankHeader />
        <Flex
          direction="row"
          width="100%"
          maxWidth="600px"
          minWidth="480px"
          height="0"
          flexGrow="1"
        >
          <HomeBoxDisplay />
        </Flex>
      </div>
      <Flex gap="2" className="right-column" direction="column">
        <Card style={{ minHeight: '50%', maxHeight: '60%', padding: 0 }}>
          <Tabs.Root style={{ flex: 1, height: '100%' }} defaultValue="filter">
            <Tabs.List size="2" style={tabStyle}>
              <Tabs.Trigger value="filter">Filter</Tabs.Trigger>
              <Tabs.Trigger value="bag">
                Item Bag <Badge style={{ marginLeft: 4, marginRight: -4 }}>BETA</Badge>
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="filter" style={{ flexGrow: 1 }}>
              <FilterPanel />
            </Tabs.Content>

            <Tabs.Content value="bag" style={{ maxHeight: 'calc(100% - 32px)', overflow: 'auto' }}>
              <ItemBag />
            </Tabs.Content>
          </Tabs.Root>
        </Card>
        <div
          className="drop-area"
          onDrop={(e) => e.dataTransfer.files.length && previewFile(e.dataTransfer.files[0])}
        >
          <div className="drop-area-text diagonal-clip">Preview</div>
        </div>

        <ReleaseArea />
      </Flex>
      <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />

      <SavesModal open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} />
    </Flex>
  )
}

export default Home
