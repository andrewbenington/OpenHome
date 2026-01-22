import { PKMInterface } from '@openhome-core/pkm/interfaces'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { Button, Dialog } from '@radix-ui/themes'
import { useState } from 'react'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'
import OpenHomeMonList from './OpenHomeMonList'
import { FindingSaveState, useManageTracked } from './useManageTracked'

export default function TrackedPokemon() {
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const { findSaveForMon, findingSaveState, clearFindingState } = useManageTracked()

  return (
    <SideTabs.Root defaultValue="all">
      <SideTabs.TabList>
        <SideTabs.Tab value="all"> All Pokémon</SideTabs.Tab>
        <SideTabs.Tab value="gen12">Gen 1/2 IDs</SideTabs.Tab>
        <SideTabs.Tab value="gen345">Gen 3/4/5 IDs</SideTabs.Tab>
        <div style={{ flex: 1 }} />
        <ToolsDialog onClose={clearFindingState} />
      </SideTabs.TabList>
      <SideTabs.Panel value="all">
        <OpenHomeMonList
          onSelectMon={(mon) => setSelectedMon(mon)}
          findSaveForMon={findSaveForMon}
        />
      </SideTabs.Panel>
      <SideTabs.Panel value="gen12">
        <Gen12Lookup onSelectMon={(mon) => setSelectedMon(mon)} />
      </SideTabs.Panel>
      <SideTabs.Panel value="gen345">
        <Gen345Lookup onSelectMon={(mon) => setSelectedMon(mon)} />
      </SideTabs.Panel>
      <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
      {findingSaveState && (
        <FindingSaveDialog state={findingSaveState} onClose={clearFindingState} />
      )}
    </SideTabs.Root>
  )
}

function ToolsDialog(props: { onClose: () => void }) {
  const { onClose } = props
  return (
    <Dialog.Root onOpenChange={(o) => !o && onClose()}>
      <Dialog.Trigger>
        <Button size="1">Manage...</Button>
      </Dialog.Trigger>
      <Dialog.Content style={{ padding: 8 }}>
        <Dialog.Title>Tracked Mon Management</Dialog.Title>
        <p>Hello</p>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function FindingSaveDialog(props: { state: FindingSaveState; onClose: () => void }) {
  const { state, onClose } = props
  return (
    <Dialog.Root open={Boolean(state)} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content style={{ padding: 8 }} minHeight="16rem">
        <Dialog.Title>Searching Saves for Pokémon</Dialog.Title>
        <p>{stateSummary(state)}</p>
        <StateBody state={state} />
      </Dialog.Content>
    </Dialog.Root>
  )
}

function stateSummary(state: FindingSaveState): string {
  switch (state.state) {
    case 'getting_recent_saves':
      return 'Getting recent saves...'
    case 'finding':
      return `Checking save ${state.currentIndex} / ${state.totalSaves}...`
    case 'found':
      return 'Pokémon found in save file!'
    case 'not_found':
      return 'Pokémon not found in any recent save file currently accessible'
    case 'error':
      return `Error: ${state.error}`
  }
}

function StateBody(props: { state: FindingSaveState }) {
  const { state } = props
  switch (state.state) {
    case 'finding':
      return (
        <div>
          <b>Checking:</b>
          <p>{state.currentSavePath}</p>
        </div>
      )
    case 'found':
      return (
        <div>
          <b>Game:</b>
          <div>{state.save.gameName}</div>
          <br />
          <b>File:</b>
          <div>{state.save.filePath.raw}</div>
        </div>
      )
    default:
      return null
  }
}
