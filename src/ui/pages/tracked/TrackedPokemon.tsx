import { PKMInterface } from '@openhome-core/pkm/interfaces'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { Button, Dialog, Flex, Inset, Separator } from '@radix-ui/themes'
import { useState } from 'react'
import { OriginGameIndicator } from 'src/ui/components/pokemon/indicator/OriginGame'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'
import OpenHomeMonList from './OpenHomeMonList'
import {
  FindingSaveForOneState,
  FindingSavesForAllState,
  FindingSavesState,
  useManageTracked,
} from './useManageTracked'

export default function TrackedPokemon() {
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const { findSaveForMon, findingSaveState, findSavesForAllMons, clearFindingState } =
    useManageTracked()

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
          findSavesForAllMons={findSavesForAllMons}
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
      <Dialog.Content>
        <Flex direction="column">
          <Dialog.Title>Tracked Mon Management</Dialog.Title>
          <Inset side="x" my="-1">
            <Separator />
          </Inset>
          <p>Hello</p>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function FindingSaveDialog(props: { state: FindingSavesState; onClose: () => void }) {
  const { state, onClose } = props
  return (
    <Dialog.Root open={Boolean(state)} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content minHeight="16rem">
        <Flex direction="column">
          <Dialog.Title>Searching Saves for Pokémon</Dialog.Title>
          <Inset side="x" my="-1">
            <Separator />
          </Inset>
          <p>{stateSummary(state)}</p>
          <DialogBody state={state} />
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function stateSummary(state: FindingSavesState): string {
  switch (state.type) {
    case 'finding_one':
      return forOneStateSummary(state.state)
    case 'finding_all':
      return forAllStateSummary(state.state)
  }
}

function forOneStateSummary(state: FindingSaveForOneState): string {
  switch (state.type) {
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

function forAllStateSummary(state: FindingSavesForAllState): string {
  switch (state.type) {
    case 'checking_save':
      return `Checking Pokémon in save ${state.currentIndex} / ${state.totalSaves}...`
    case 'complete':
      return 'All saves have been checked!'
    case 'error':
      return `Error: ${state.error}`
  }
}

function DialogBody(props: { state: FindingSavesState }) {
  const { state } = props
  switch (state.type) {
    case 'finding_one':
      return <ForOneStateBody state={state.state} />
    case 'finding_all':
      return <ForAllStateBody state={state.state} />
  }
}

function ForOneStateBody(props: { state: FindingSaveForOneState }) {
  const { state } = props
  switch (state.type) {
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

function ForAllStateBody(props: { state: FindingSavesForAllState }) {
  const { state } = props
  switch (state.type) {
    case 'checking_save':
      return (
        <div>
          <Flex gap="1" align="center">
            <b>Checking:</b>
            <OriginGameIndicator
              originGame={state.currentSaveRef.game}
              plugin={state.currentSaveRef.pluginIdentifier}
              withName
            />
          </Flex>
          <Flex gap="1" align="center">
            <b>Player:</b>
            {state.currentSaveRef.trainerName} ({state.currentSaveRef.trainerID})
          </Flex>
          <p>
            {state.foundMons} Pokémon found in saves so far (
            {Math.round((state.foundMons / state.totalSaves) * 100)}%)
          </p>
        </div>
      )
    case 'complete':
      return (
        <div>
          <p>
            {state.foundMons} / {state.totalMons} processed Pokémon were found
          </p>
        </div>
      )
    default:
      return null
  }
}
