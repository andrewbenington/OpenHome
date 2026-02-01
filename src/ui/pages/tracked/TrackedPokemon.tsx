import { PKMInterface } from '@openhome-core/pkm/interfaces'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { useState } from 'react'
import { Route, Routes } from 'react-router'
import { usePathSegment } from 'src/ui/hooks/routing'
import AllTrackedPokemon from './AllTrackedPokemon'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'

export default function TrackedPokemon() {
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const { currentSegment, setCurrentSegment } = usePathSegment('manage', 'all')

  const allTrackedElement = <AllTrackedPokemon onSelectMon={setSelectedMon} />

  return (
    <SideTabs.Root value={currentSegment} onValueChange={setCurrentSegment}>
      <SideTabs.TabList>
        <SideTabs.Tab value="all"> All Pokémon</SideTabs.Tab>
        <SideTabs.Tab value="gen12">Gen 1/2 IDs</SideTabs.Tab>
        <SideTabs.Tab value="gen345">Gen 3/4/5 IDs</SideTabs.Tab>
      </SideTabs.TabList>
      <Routes>
        <Route index path="" element={allTrackedElement} />
        <Route path="all" element={allTrackedElement} />
        <Route path="gen12" element={<Gen12Lookup onSelectMon={setSelectedMon} />} />
        <Route path="gen345" element={<Gen345Lookup onSelectMon={setSelectedMon} />} />
      </Routes>
      <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
    </SideTabs.Root>
  )
}
