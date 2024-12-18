import { Autocomplete, Card, Chip, Modal, ModalDialog, ModalOverflow, Stack } from '@mui/joy'
import dayjs from 'dayjs'
import { useContext, useMemo, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import PokemonDetailsPanel from 'src/pokemon/PokemonDetailsPanel'
import BoxCell from 'src/saves/boxes/BoxCell'
import SavesModal from 'src/saves/SavesModal'
import { SelectPlugin } from 'src/saves/SelectPlugin'
import { SAVClass } from 'src/types/SAVTypes/util'
import { filterUndefined } from 'src/util/Sort'
import { LookupContext } from '../../state/lookup'
import { OpenSavesContext } from '../../state/openSaves'
import { PKMInterface } from '../../types/interfaces'

function getSortFunction(
  sortStr: string | undefined
): (a: { mon: PKMInterface }, b: { mon: PKMInterface }) => number {
  switch (sortStr?.toLowerCase()) {
    case 'nickname':
      return (a, b) => a.mon.nickname.localeCompare(b.mon.nickname)
    case 'level':
      return (a, b) => b.mon.getLevel() - a.mon.getLevel()
    case 'species':
      return (a, b) => a.mon.dexNum - b.mon.dexNum
    case 'origin':
      return (a, b) => a.mon.gameOfOrigin - b.mon.gameOfOrigin
    case 'met_date':
      return (a, b) => {
        const aDate =
          'metDate' in a.mon && a.mon.metDate
            ? dayjs(new Date(a.mon.metDate.year, a.mon.metDate.month, a.mon.metDate.day)).unix()
            : 0
        const bDate =
          'metDate' in b.mon && b.mon.metDate
            ? dayjs(new Date(b.mon.metDate.year, b.mon.metDate.month, b.mon.metDate.day)).unix()
            : 0

        return bDate - aDate
      }
    case 'ribbons':
      return (a, b) => {
        const aCount = a.mon.ribbons ? a.mon.ribbons.length : 0
        const bCount = b.mon.ribbons ? b.mon.ribbons.length : 0

        return bCount - aCount
      }
    default:
      return () => 0
  }
}

export default function SortPokemon() {
  const [{ homeMons }] = useContext(LookupContext)
  const [{ homeData }, , openSaves] = useContext(OpenSavesContext)
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const [tab, setTab] = useState('summary')
  const [sort, setSort] = useState('')
  const [specifySave, setSpecifySave] = useState<{
    supportedSaveTypes: SAVClass[]
    plugins: string[]
    onSelect?: (plugin: string) => void
  } | null>(null)

  const allMonsWithColors = useMemo(() => {
    if (!homeData) return []
    const all: { mon: PKMInterface; color: string }[] = openSaves
      .flatMap((save) =>
        save.boxes.flatMap((box) =>
          box.pokemon.flatMap((mon) => (mon ? { mon, color: save.gameColor() } : undefined))
        )
      )
      .concat(
        Object.values(homeData.boxes.flatMap((box) => box.pokemon) ?? {}).map((mon) =>
          mon ? { mon, color: homeData.gameColor() } : undefined
        )
      )
      .filter(filterUndefined)

    return all
  }, [openSaves, homeData])

  if (!homeMons) return <div />
  return (
    <Stack direction="row" flexWrap="wrap" padding={1} overflow="hidden" height="calc(100% - 16px)">
      <Card style={{ height: 'calc(100% - 16px)' }}>
        <Stack style={{ width: 120, flex: 0 }}>
          <Chip variant="solid">OpenHome</Chip>
          {openSaves.map((save) => (
            <Chip key={save.tid} variant="solid">
              {save.name} ({save.tid})
            </Chip>
          ))}
          <Chip onClick={() => setOpenSaveDialog(true)}>
            <MdAdd />
          </Chip>
        </Stack>
      </Card>
      <Stack style={{ flex: 1, height: '100%' }}>
        <Card>
          <Autocomplete
            options={['nickname', 'level', 'species', 'ribbons', 'met_date', 'origin']}
            onChange={(_, value) => setSort(value?.at(0) ?? '')}
            placeholder="Sort"
          />
        </Card>
        <Card style={{ overflowY: 'auto' }}>
          <Stack direction="row" flexWrap="wrap" justifyContent="center">
            {Object.values(allMonsWithColors)
              .sort(getSortFunction(sort))
              .map((monWithSave, i) => (
                <div style={{ width: 36, height: 36, margin: 4 }} key={`mon_${i}`}>
                  <BoxCell
                    onClick={() => setSelectedMon(monWithSave.mon)}
                    onDrop={() => {}}
                    mon={monWithSave.mon}
                    disabled={false}
                    zIndex={2}
                    borderColor={monWithSave.color}
                  />
                </div>
              ))}
          </Stack>
        </Card>
      </Stack>
      <Modal open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <ModalDialog sx={{ minHeight: 400, height: 600, width: 1000 }}>
          <SavesModal
            onClose={() => {
              setOpenSaveDialog(false)
            }}
            setSpecifySave={setSpecifySave}
          />
        </ModalDialog>
      </Modal>
      <Modal open={!!selectedMon} onClose={() => setSelectedMon(undefined)}>
        <ModalOverflow>
          <ModalDialog
            style={{
              width: 800,
              maxWidth: '80%',
              padding: 0,
              maxHeight: '95%',
              overflow: 'hidden',
            }}
          >
            {selectedMon && <PokemonDetailsPanel mon={selectedMon} tab={tab} setTab={setTab} />}
          </ModalDialog>
        </ModalOverflow>
      </Modal>
      {specifySave && (
        <SelectPlugin
          plugins={specifySave.plugins}
          onPluginClick={(selectedPlugin) => {
            // console.log(`Selected plugin: ${selectedPlugin}`)
            specifySave.onSelect?.(selectedPlugin)
            setSpecifySave(null)
          }}
        />
      )}
    </Stack>
  )
}
