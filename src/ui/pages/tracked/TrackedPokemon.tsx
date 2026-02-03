import { PKMInterface } from '@openhome-core/pkm/interfaces'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { Button, Dialog, DropdownMenu, Flex, Inset, Separator } from '@radix-ui/themes'
import { PropsWithChildren, ReactNode, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router'
import { OhpkmIdentifier } from 'src/core/pkm/Lookup'
import { SAV } from 'src/core/save/interfaces'
import MessageRibbon from 'src/ui/components/MessageRibbon'
import { OriginGameIndicator } from 'src/ui/components/pokemon/indicator/OriginGame'
import { usePathSegment } from 'src/ui/hooks/routing'
import { useSaves } from 'src/ui/state/saves'
import AllTrackedPokemon from './AllTrackedPokemon'
import Gen12Lookup from './Gen12Lookup'
import Gen345Lookup from './Gen345Lookup'
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
    <AllTrackedPokemon
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

interface FindingSaveDialogProps {
  state: FindingSavesState
  onClose: () => void
}

function FindingSaveDialog(props: FindingSaveDialogProps) {
  const { state, onClose } = props
  const summary = stateSummary(state)
  const summaryNode = typeof summary === 'string' ? <h4>{summary}</h4> : summary
  return (
    <Dialog.Root open={Boolean(state)} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content>
        <Flex direction="column" flexGrow="1" height="100%">
          <Dialog.Title>
            Searching Saves for Pokémon
            <Inset side="x" mt="2">
              <Separator />
            </Inset>
          </Dialog.Title>
          <Flex className="findind-save-dialog-body" direction="column" gap="3">
            {summaryNode}
            <DialogBody state={state} onClose={onClose} />
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

interface DialogBodyProps {
  state: FindingSavesState
  onClose?: () => void
}

function DialogBody(props: DialogBodyProps) {
  switch (props.state.type) {
    case 'finding_one':
      return <ForOneStateBody state={props.state.state} onClose={props.onClose} />
    case 'finding_all':
      return <ForAllStateBody state={props.state.state} onClose={props.onClose} />
  }
}

interface ForOneStateBodyProps {
  state: FindingSaveForOneState
  onClose?: () => void
}

function ForOneStateBody(props: ForOneStateBodyProps) {
  const { state, onClose } = props
  const saves = useSaves()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  function openSaveAndNavToHome(save: SAV) {
    saves.addSave(save)
    navigate('/home')
  }

  function recoverToBox(boxIndex: number) {
    // Radix UI is bugged when you have a dropdown and a dialog open at the same time.
    // This is necessary to restore clickability for the whole app
    document.body.style.pointerEvents = 'auto'

    setLoading(true)
    saves.recoverMonToBox(state.id, boxIndex)
    saves.homeBoxSetCurrent(boxIndex)
    navigate('/home')
  }

  switch (state.type) {
    case 'finding':
      return (
        <div style={{ minHeight: '12rem ' }}>
          <b>Checking:</b>
          <p>{state.currentSavePath}</p>
        </div>
      )
    case 'found':
      return (
        <Flex direction="column" gap="2" ml="4">
          <Flex gap="1" align="center">
            <div className="fixed-width-label">Game:</div>
            <OriginGameIndicator
              originGame={state.save.origin}
              plugin={state.save.pluginIdentifier}
              withName
            />
          </Flex>
          <Flex gap="1" align="center">
            <div className="fixed-width-label">Player:</div>
            {state.save.name} ({state.save.displayID})
          </Flex>
          <Flex gap="1" align="center">
            <div className="fixed-width-label">Location:</div>
            Box {state.location.box + 1}, Slot {state.location.boxSlot + 1}
          </Flex>
          <Flex gap="1">
            <div className="fixed-width-label">File:</div>
            {state.save.filePath.raw}
          </Flex>
          <ButtonStack>
            <Button size="1" onClick={() => openSaveAndNavToHome(state.save)}>
              Open Save
            </Button>
            <Button size="1" color="gray" onClick={onClose}>
              Close
            </Button>
          </ButtonStack>
        </Flex>
      )
    case 'not_found':
      return (
        <Flex>
          <ButtonStack>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button size="1" loading={loading}>
                  Recover to Box...
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content side="right" size="2">
                {saves.homeData.boxes.map((homeBox) => (
                  <DropdownMenu.Item key={homeBox.id} onClick={() => recoverToBox(homeBox.index)}>
                    {homeBox.nameOrDefault()}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <Button size="1" color="gray" onClick={onClose}>
              Close
            </Button>
          </ButtonStack>
        </Flex>
      )
    default:
      return null
  }
}

interface ForAllStateBodyProps {
  state: FindingSavesForAllState
  onClose?: () => void
}

function ForAllStateBody(props: ForAllStateBodyProps) {
  const { state, onClose } = props
  const [loading, setLoading] = useState(false)
  const saves = useSaves()
  const navigate = useNavigate()

  function recoverMons(ids: OhpkmIdentifier[]) {
    setLoading(true)
    const firstNewBoxIndex = saves.newBoxesWithIds(ids, 'Recovered Pokémon')
    if (firstNewBoxIndex !== undefined) {
      saves.homeBoxSetCurrent(firstNewBoxIndex)
    }
    navigate('/home')?.then(() => setLoading(false))
  }

  switch (state.type) {
    case 'checking_save':
      const foundPercent = Math.round((state.foundMons / state.totalMons) * 100)
      return (
        <Flex direction="column" gap="2">
          <Flex gap="1" align="center">
            <p className="fixed-width-label">Game:</p>
            <OriginGameIndicator
              originGame={state.currentSaveRef.game}
              plugin={state.currentSaveRef.pluginIdentifier}
              withName
            />
          </Flex>
          <Flex gap="1" align="center">
            <p className="fixed-width-label">Player:</p>
            {state.currentSaveRef.trainerName} ({state.currentSaveRef.trainerID})
          </Flex>
          <p>
            {state.foundMons} Pokémon found in saves so far ({foundPercent}%)
          </p>
        </Flex>
      )
    case 'complete':
      return (
        <Flex direction="column" flexGrow="1" gap="2">
          <p>
            {state.foundMons} / {state.totalMons} processed Pokémon were found
          </p>
          {state.missingMonIds.length > 0 && (
            <p>
              What would you like to do with the {state.missingMonIds.length} Pokémon not found?
            </p>
          )}
          <ButtonStack>
            {state.missingMonIds.length > 0 && (
              <Button size="1" onClick={() => recoverMons(state.missingMonIds)} loading={loading}>
                Recover All to New Boxes
              </Button>
            )}
            <Button size="1" color="gray" onClick={onClose}>
              Close
            </Button>
          </ButtonStack>
        </Flex>
      )
    default:
      return null
  }
}

function ButtonStack(props: PropsWithChildren) {
  return (
    <Flex direction="column" ml="auto" minWidth="6rem" gap="1" height="100%">
      {props.children}
    </Flex>
  )
}
