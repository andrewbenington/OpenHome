import { OHPKM } from '@openhome/core/pkm/OHPKM'
import { BackendContext } from '@openhome/ui/backend/backendContext'
import PokemonIcon from '@openhome/ui/components/PokemonIcon'
import useDisplayError from '@openhome/ui/hooks/displayError'
import PokemonDetailsModal from '@openhome/ui/pokemon-details//Modal'
import BankHeader from '@openhome/ui/saves/BankHeader'
import HomeBoxDisplay from '@openhome/ui/saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '@openhome/ui/saves/boxes/SaveBoxDisplay'
import ItemBag from '@openhome/ui/saves/ItemBag'
import SavesModal from '@openhome/ui/saves/SavesModal'
import { useSaves } from '@openhome/ui/state/saves/useSaves'
import { bytesToPKMInterface } from '@pokemon-files/pkm'
import { Badge, Button, Card, Flex, Tabs } from '@radix-ui/themes'
import lodash from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdFileOpen } from 'react-icons/md'
import { PKMInterface } from 'src/types/interfaces'
import { CSSWithVariables } from 'src/types/types'
import FilterPanel from 'src/ui/pages/home/filter/FilterPanel'
import './Home.css'
import ReleaseArea from './ReleaseArea'

const Home = () => {
  const backend = useContext(BackendContext)
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const savesAndBanks = useSaves()
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
        {lodash.range(savesAndBanks.allOpenSaves.length).map((i) => (
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
        <Card style={{ minHeight: '50%', maxHeight: '60%', padding: 0, contain: 'none' }}>
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
      {/* force icons sprite sheet to stay loaded */}
      <PokemonIcon dexNumber={0} />
      <SavesModal open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} />
    </Flex>
  )
}

export default Home
