import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getSortFunction, SortType, SortTypes } from '@openhome-core/pkm/sort'
import { filterUndefined } from '@openhome-core/util/sort'
import Autocomplete from '@openhome-ui/components/Autocomplete'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import PokemonDetailsModal from '@openhome-ui/pokemon-details//Modal'
import SavesModal from '@openhome-ui/saves/SavesModal'
import { useSaves } from '@openhome-ui/state/saves'
import { OriginGames } from '@pkm-rs/pkg'
import { Badge, Card, Flex } from '@radix-ui/themes'
import { useMemo, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { useOhpkmStore } from '../../state/ohpkm'

function getInnerSortFunction(
  sortStr: SortType | undefined
): (a: { mon: PKMInterface }, b: { mon: PKMInterface }) => number {
  const sortFunction = getSortFunction(sortStr)

  return (a, b) => sortFunction(a.mon, b.mon)
}

type MonWithColors = { mon: PKMInterface; color: string }

export default function SortPokemon() {
  const savesAndBanks = useSaves()
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const [sort, setSort] = useState<SortType>('')
  const ohpkmStore = useOhpkmStore()

  const allMonsWithColors: MonWithColors[] = useMemo(() => {
    return savesAndBanks.allOpenSaves
      .flatMap((save) =>
        save.boxes
          .flatMap((box) => box.boxSlots)
          .filter(filterUndefined)
          .map((mon) => ({
            mon: ohpkmStore.monOrOhpkmIfTracked(mon),
            color: OriginGames.color(save.origin),
          }))
      )
      .concat(
        savesAndBanks.homeData
          .getCurrentBank()
          .allContainedMons()
          .map((identifier) => (identifier ? ohpkmStore.getById(identifier) : undefined))
          .filter(filterUndefined)
          .map((mon) => ({
            mon,
            color: savesAndBanks.homeData.gameColor(),
          }))
      )
  }, [ohpkmStore, savesAndBanks.allOpenSaves, savesAndBanks.homeData])

  const sortedMonsWithColors = useMemo(() => {
    return sort
      ? Object.values(allMonsWithColors).sort(getInnerSortFunction(sort))
      : Object.values(allMonsWithColors)
  }, [allMonsWithColors, sort])

  const selectedMon = useMemo(
    () => (selectedIndex !== undefined ? sortedMonsWithColors[selectedIndex]?.mon : undefined),
    [sortedMonsWithColors, selectedIndex]
  )

  const boxCells = useMemo(() => {
    return sortedMonsWithColors.map((monWithSave, i) => (
      <div style={{ width: 36, height: 36, margin: 4 }} key={`mon_${i}`}>
        <button
          onClick={() => setSelectedIndex(i)}
          className="mon-icon-button"
          style={{
            borderColor: monWithSave.color,
            borderWidth: 2,
            borderStyle: 'solid',
          }}
        >
          <PokemonIcon
            dexNumber={monWithSave.mon.dexNum}
            formeNumber={monWithSave.mon.formeNum}
            isEgg={monWithSave.mon.isEgg}
            isShiny={monWithSave.mon.isShiny()}
            style={{ width: 30, height: 30 }}
          />
        </button>
      </div>
    ))
  }, [sortedMonsWithColors])

  return (
    <Flex direction="row" wrap="wrap" overflow="hidden" height="calc(100% - 16px)" m="2" gap="2">
      <Card style={{ height: '100%' }}>
        <Flex direction="column" gap="1" style={{ width: 180, flex: 0 }}>
          <Badge
            color="gray"
            size="3"
            style={{ border: `2px solid ${savesAndBanks.homeData.gameColor()}` }}
          >
            OpenHome
          </Badge>
          {savesAndBanks.allOpenSaves.map((save) => (
            <Badge
              color="gray"
              size="3"
              key={save.tid}
              style={{ border: `2px solid ${OriginGames.color(save.origin)}` }}
            >
              {save.name} ({save.tid})
            </Badge>
          ))}
          <button
            onClick={() => setOpenSaveDialog(true)}
            style={{ padding: 0, display: 'grid', justifyContent: 'center' }}
          >
            <MdAdd />
          </button>
        </Flex>
      </Card>
      <Flex direction="column" gap="2" style={{ flex: 1, height: '100%' }}>
        <Card style={{ contain: 'none' }}>
          <Autocomplete
            value={sort ?? null}
            options={SortTypes}
            onChange={(value) => setSort(value ?? '')}
            label="Sort"
            getOptionString={(opt) => opt}
            getOptionUniqueID={(opt) => opt}
          />
        </Card>
        <Card style={{ overflowY: 'hidden', height: '100%', padding: 0 }}>
          <Flex
            direction="row"
            wrap="wrap"
            justify="center"
            overflow="auto"
            height="calc(100% - 16px)"
            style={{ padding: 8, alignContent: 'start' }}
          >
            {boxCells}
          </Flex>
        </Card>
      </Flex>
      <SavesModal open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} />
      <PokemonDetailsModal
        mon={selectedMon}
        onClose={() => setSelectedIndex(undefined)}
        navigateLeft={() =>
          sortedMonsWithColors.length && selectedIndex !== undefined
            ? setSelectedIndex(
                selectedIndex === 0 ? sortedMonsWithColors.length - 1 : selectedIndex - 1
              )
            : undefined
        }
        navigateRight={() =>
          sortedMonsWithColors.length && selectedIndex !== undefined
            ? setSelectedIndex((selectedIndex + 1) % sortedMonsWithColors.length)
            : undefined
        }
      />
    </Flex>
  )
}
