import { Item, OriginGames, SpeciesLookup } from '@pkm-rs/pkg'
import { Card, Flex, Heading, Separator } from '@radix-ui/themes'
import { useContext } from 'react'
import { DevDataDisplay } from 'src/components/DevDataDisplay'
import { InfoGrid } from 'src/components/InfoGrid2'
import { useAppState } from 'src/state/app-state/appState'
import { AppInfoContext, AppInfoState } from 'src/state/appInfo'
import { ItemBagContext, ItemBagState } from 'src/state/items/reducer'
import { OpenSavesState } from 'src/state/saves/reducer'
import { PKMInterface } from 'src/types/interfaces'
import { ErrorContext } from '../../state/error'
import { useSaves } from '../../state/saves/useSaves'

export default function AppStateDisplay() {
  const appState = useAppState()
  const [appInfoState] = useContext(AppInfoContext)
  const savesAndBanks = useSaves()
  const [errorState, dispatchErrorState] = useContext(ErrorContext)
  const [bagState] = useContext(ItemBagContext)

  return (
    <Flex direction="column">
      <Card style={{ margin: 8 }}>
        <Flex direction="column" gap="2">
          <Heading size="4">Backend App State</Heading>
          <Separator style={{ width: '100%', color: 'inherit' }} />
          <InfoGrid data={appState ?? {}} />
        </Flex>
      </Card>
      <Card style={{ margin: 8, display: 'flex', flexDirection: 'row', gap: 8 }}>
        <DevDataDisplay data={appInfoDisplay(appInfoState)} label="App Info State" />
        <DevDataDisplay data={openSavesDisplay(savesAndBanks)} label="Saves/Mons State" />
        <DevDataDisplay data={bagDisplay(bagState)} label="Bag State" />
        <DevDataDisplay data={errorState} label="Error State" />
        <button
          onClick={() =>
            dispatchErrorState({
              type: 'set_message',
              payload: { title: 'Test Error Title', messages: ['Message 1', 'Message 2'] },
            })
          }
        >
          Test Error
        </button>
      </Card>
    </Flex>
  )
}

function appInfoDisplay(state: AppInfoState) {
  return {
    settings: state.settings,
    officialSaveTypes: state.officialSaveTypes.map((saveType) => saveType.name),
  }
}

function openSavesDisplay(state: OpenSavesState) {
  return {
    'Modified Mons': Object.fromEntries(
      Object.entries(state.modifiedOHPKMs).map(([key, val]) => [key, monDisplay(val)])
    ),
    'Home Data': state.homeData?.displayState(),
    Banks: state.homeData?.banks.map((bank) => ({
      name: bank.name,
      index: bank.index,
      boxes: bank.boxes,
    })),
    Error: state.error,
  }
}

function monDisplay(mon: PKMInterface) {
  const species = SpeciesLookup(mon.dexNum)

  return {
    species: species?.name,
    forme: species?.formes[mon.formeNum ?? 0].formeName,
    nickname: mon.nickname,
    origin: mon.gameOfOrigin ? `Pokémon ${OriginGames.gameName(mon.gameOfOrigin)}` : undefined,
  }
}

function bagDisplay(state: ItemBagState) {
  return {
    Loaded: state.loaded,
    Modified: state.modified,
    Error: state.error ?? 'None',
    Items: Object.entries(state.itemCounts).map(([indexStr, qty]) => ({
      name: Item.fromIndex(parseInt(indexStr)),
      qty,
    })),
  }
}
