import { useState } from 'react'
import SideTabs from 'src/components/side-tabs/SideTabs'
import PokemonDetailsModal from '../../pokemon-details/Modal'
import { PKMInterface } from '../../types/interfaces'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'
import OpenHomeMonList from './OpenHomeMonList'

export default function TrackedPokemon() {
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()

  return (
    <SideTabs.Root defaultValue="all">
      <SideTabs.TabList>
        <SideTabs.Tab value="all"> All Pokémon</SideTabs.Tab>
        <SideTabs.Tab value="gen12">Gen 1/2 IDs</SideTabs.Tab>
        <SideTabs.Tab value="gen345">Gen 3/4/5 IDs</SideTabs.Tab>
      </SideTabs.TabList>
      <SideTabs.Panel value="all">
        <OpenHomeMonList onSelectMon={(mon) => setSelectedMon(mon)} />
      </SideTabs.Panel>
      <SideTabs.Panel value="gen12">
        <Gen12Lookup onSelectMon={(mon) => setSelectedMon(mon)} />
      </SideTabs.Panel>
      <SideTabs.Panel value="gen345">
        <Gen345Lookup onSelectMon={(mon) => setSelectedMon(mon)} />
      </SideTabs.Panel>
      <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
    </SideTabs.Root>
  )
}
