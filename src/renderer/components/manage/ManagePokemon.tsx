import { Tab, tabClasses, TabList, TabPanel, Tabs } from '@mui/joy'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'
import OpenHomeMonList from './OpenHomeMonList'

export default function ManagePokemon() {
  return (
    <Tabs defaultValue="all" orientation="vertical" style={{ height: '100%' }}>
      <TabList
        disableUnderline
        sx={{
          whiteSpace: 'nowrap',
          p: 0.8,
          gap: 0.5,
          bgcolor: '#466',
          [`& .${tabClasses.root}`]: {
            borderRadius: 'lg',
          },
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
            bgcolor: 'background.surface',
          },
        }}
      >
        <Tab disableIndicator value={'all'}>
          All Pokémon
        </Tab>
        <Tab disableIndicator value={'gen12'}>
          Gen 1/2 IDs
        </Tab>
        <Tab disableIndicator value={'gen345'}>
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
    </Tabs>
  )
}
