import { Card, Modal, Tab, tabClasses, TabList, TabPanel, Tabs } from '@mui/joy'
import { useState } from 'react'
import PokemonDetailsPanel from '../../pokemon/PokemonDetailsPanel'
import { PKMInterface } from '../../types/interfaces'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'
import OpenHomeMonList from './OpenHomeMonList'

export default function TrackedPokemon() {
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const [pokemonDisplayTab, setPokemonDisplayTab] = useState('summary')

  return (
    <Tabs defaultValue="all" orientation="vertical" style={{ height: '100%' }}>
      <TabList
        className="padding-on-macos"
        variant="solid"
        color="primary"
        sx={{
          whiteSpace: 'nowrap',
          p: 0.8,
          gap: 0.5,
          [`& .${tabClasses.root}`]: {
            borderRadius: 'lg',
          },
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
          },
        }}
      >
        <Tab disableIndicator value={'all'} variant="solid" color="primary">
          All Pokémon
        </Tab>
        <Tab disableIndicator value={'gen12'} variant="solid" color="primary">
          Gen 1/2 IDs
        </Tab>
        <Tab disableIndicator value={'gen345'} variant="solid" color="primary">
          Gen 3/4/5 IDs
        </Tab>
      </TabList>
      <TabPanel value="all">
        <OpenHomeMonList />
      </TabPanel>
      <TabPanel value="gen12">
        <Gen12Lookup />
      </TabPanel>
      <TabPanel value="gen345">
        <Gen345Lookup />
      </TabPanel>
      <Modal
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        // maxWidth="md"
        // PaperProps={{ sx: { height: 400, maxWidth: 800 } }}
      >
        <Card style={{ width: 800, height: 400, padding: 0, overflow: 'hidden' }}>
          {selectedMon && (
            <PokemonDetailsPanel
              mon={selectedMon}
              tab={pokemonDisplayTab}
              setTab={setPokemonDisplayTab}
            />
          )}
        </Card>
      </Modal>
    </Tabs>
  )
}
