import { PKMInterface } from '@openhome-core/pkm/interfaces'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { Button, Dialog, Flex, Inset, Separator } from '@radix-ui/themes'
import { ReactNode, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router'
import MessageRibbon from 'src/ui/components/MessageRibbon'
import { OriginGameIndicator } from 'src/ui/components/pokemon/indicator/OriginGame'
import { usePathSegment } from 'src/ui/hooks/routing'
import { useSaves } from 'src/ui/state/saves'
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
  const { currentSegment, setCurrentSegment } = usePathSegment('manage', 'all')

  const allTrackedElement = (
    <OpenHomeMonList
      onSelectMon={setSelectedMon}
      findSaveForMon={findSaveForMon}
      findSavesForAllMons={findSavesForAllMons}
    />
  )

  return (
    <SideTabs.Root value={currentSegment} onValueChange={setCurrentSegment}>
      <SideTabs.TabList>
        <SideTabs.Tab value="all"> All Pokémon</SideTabs.Tab>
        <SideTabs.Tab value="gen12">Gen 1/2 IDs</SideTabs.Tab>
        <SideTabs.Tab value="gen345">Gen 3/4/5 IDs</SideTabs.Tab>
        <div style={{ flex: 1 }} />
        <ToolsDialog onClose={clearFindingState} />
      </SideTabs.TabList>
      <Routes>
        <Route index path="" element={allTrackedElement} />
        <Route path="all" element={allTrackedElement} />
        <Route path="gen12" element={<Gen12Lookup onSelectMon={setSelectedMon} />} />
        <Route path="gen345" element={<Gen345Lookup onSelectMon={setSelectedMon} />} />
      </Routes>
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
  const summary = stateSummary(state)
  const summaryNode = typeof summary === 'string' ? <h3>{summary}</h3> : summary
  return (
    <Dialog.Root open={Boolean(state)} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content minHeight="18rem">
        <Flex direction="column">
          <Dialog.Title>
            Searching Saves for Pokémon
            <Inset side="x" mt="2">
              <Separator />
            </Inset>
          </Dialog.Title>
          <Flex direction="column" gap="3">
            {summaryNode}
            <DialogBody state={state} />
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function stateSummary(state: FindingSavesState): ReactNode {
  switch (state.type) {
    case 'finding_one':
      return forOneStateSummary(state.state)
    case 'finding_all':
      return forAllStateSummary(state.state)
  }
}

function forOneStateSummary(state: FindingSaveForOneState): ReactNode {
  switch (state.type) {
    case 'getting_recent_saves':
      return 'Getting recent saves...'
    case 'finding':
      return `Checking save ${state.currentIndex} / ${state.totalSaves}...`
    case 'found':
      return <MessageRibbon type="success">Pokémon found in save file!</MessageRibbon>
    case 'not_found':
      return (
        <MessageRibbon type="warning">
          Pokémon not found in any recent save file currently accessible
        </MessageRibbon>
      )
    case 'error':
      return <MessageRibbon type="error">Error: {state.error}</MessageRibbon>
  }
}

function forAllStateSummary(state: FindingSavesForAllState): ReactNode {
  switch (state.type) {
    case 'checking_save':
      return `Checking Pokémon in save ${state.currentIndex} / ${state.totalSaves}...`
    case 'complete':
      return <MessageRibbon type="success">All saves have been checked!</MessageRibbon>
    case 'error':
      return <MessageRibbon type="error">Error: {state.error}</MessageRibbon>
  }
}

function DialogBody(props: { state: FindingSavesState }) {
  switch (props.state.type) {
    case 'finding_one':
      return <ForOneStateBody state={props.state.state} />
    case 'finding_all':
      return <ForAllStateBody state={props.state.state} />
  }
}

function ForOneStateBody(props: { state: FindingSaveForOneState }) {
  const { state } = props
  const saves = useSaves()
  const navigate = useNavigate()

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
        <Flex direction="column" gap="2" ml="4">
          <Flex gap="1" align="center">
            <b style={{ minWidth: '5rem' }}>Game:</b>
            <OriginGameIndicator
              originGame={state.save.origin}
              plugin={state.save.pluginIdentifier}
              withName
            />
          </Flex>
          <Flex gap="1" align="center">
            <b style={{ minWidth: '5rem' }}>Player:</b>
            {state.save.name} ({state.save.displayID})
          </Flex>
          <Flex gap="1" align="center">
            <b style={{ minWidth: '5rem' }}>Location:</b>
            Box {state.location.box + 1}, Slot {state.location.boxSlot + 1}
          </Flex>
          <Flex gap="1">
            <b style={{ minWidth: '5rem' }}>File:</b>
            {state.save.filePath.raw}
          </Flex>
          <Button
            style={{ width: 'fit-content ' }}
            onClick={() => {
              saves.addSave(state.save)
              navigate('/home')
            }}
          >
            Open Save
          </Button>
        </Flex>
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
