import { Autocomplete, Card, Chip, Modal, ModalDialog, Stack } from '@mui/joy'
import dayjs from 'dayjs'
import { GameOfOrigin } from 'pokemon-resources'
import { useContext, useMemo, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import PokemonDetailsPanel from 'src/renderer/pokemon/PokemonDetailsPanel'
import BoxCell from 'src/renderer/saves/boxes/BoxCell'
import SavesModal from 'src/renderer/saves/SavesModal'
import { PKMFile } from 'src/types/pkm/util'
import { filterUndefined } from 'src/util/Sort'
import { LookupContext } from '../../state/lookup'
import { OpenSavesContext } from '../../state/openSaves'

function getSortFunction(
  sortStr: string | undefined
): (
  a: { mon: PKMFile; saveGame: GameOfOrigin },
  b: { mon: PKMFile; saveGame: GameOfOrigin }
) => number {
  switch (sortStr?.toLowerCase()) {
    case 'nickname':
      return (a, b) => a.mon.nickname.localeCompare(b.mon.nickname)
    case 'level':
      return (a, b) => b.mon.getLevel() - a.mon.getLevel()
    case 'species':
      return (a, b) => a.mon.dexNum - b.mon.dexNum
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
        const aCount = 'ribbons' in a.mon ? a.mon.ribbons.length : 0
        const bCount = 'ribbons' in b.mon ? b.mon.ribbons.length : 0
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
  const [selectedMon, setSelectedMon] = useState<PKMFile>()
  const [tab, setTab] = useState('summary')
  const [sort, setSort] = useState('')

  const allMonsWithSaves = useMemo(() => {
    const all: { mon: PKMFile; saveGame: GameOfOrigin }[] = openSaves
      .flatMap((save) =>
        save.boxes.flatMap((box) =>
          box.pokemon.flatMap((mon) => (mon ? { mon, saveGame: save.origin } : undefined))
        )
      )
      .concat(
        Object.values(homeData?.boxes.flatMap((box) => box.pokemon) ?? {}).map((mon) =>
          mon ? { mon, saveGame: 0 } : undefined
        )
      )
      .filter(filterUndefined)

    return all
  }, [openSaves, homeData?.boxes])

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
            options={['nickname', 'level', 'species', 'ribbon', 'met_date']}
            onChange={(_, value) => setSort(value ?? '')}
            placeholder="Sort"
          />
        </Card>
        <Card style={{ overflowY: 'auto' }}>
          <Stack direction="row" flexWrap="wrap" justifyContent="center">
            {Object.values(allMonsWithSaves)
              .sort(getSortFunction(sort))
              .map((monWithSave, i) => (
                <div style={{ width: 36, height: 36, margin: 4 }} key={`mon_${i}`}>
                  <BoxCell
                    onClick={() => setSelectedMon(monWithSave.mon)}
                    onDragEvent={() => {}}
                    onDrop={() => {}}
                    key=""
                    mon={monWithSave.mon}
                    disabled={false}
                    zIndex={2}
                    borderColor={
                      monWithSave.saveGame ? GameColors[monWithSave.saveGame] : GameColors[0]
                    }
                  />
                </div>
              ))}
          </Stack>
        </Card>
      </Stack>
      <Modal
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        // fullWidth
        // PaperProps={{ sx: { height: 800 } }}
      >
        <ModalDialog sx={{ minHeight: 400, height: 600, width: 1000 }}>
          <SavesModal
            onClose={() => {
              setOpenSaveDialog(false)
            }}
          />
        </ModalDialog>
      </Modal>
      <Modal open={!!selectedMon} onClose={() => setSelectedMon(undefined)}>
        <Card style={{ width: 800, height: 400, padding: 0, overflow: 'hidden' }}>
          {selectedMon && <PokemonDetailsPanel mon={selectedMon} tab={tab} setTab={setTab} />}
        </Card>
      </Modal>
    </Stack>
  )
}

const GameColors: Record<GameOfOrigin, string> = {
  [0]: '#00000000',
  [GameOfOrigin.INVALID_6]: '#000000',
  [GameOfOrigin.INVALID_9]: '#000000',
  [GameOfOrigin.INVALID_13]: '#000000',
  [GameOfOrigin.INVALID_14]: '#000000',
  [GameOfOrigin.INVALID_16]: '#000000',
  [GameOfOrigin.INVALID_17]: '#000000',
  [GameOfOrigin.INVALID_18]: '#000000',
  [GameOfOrigin.INVALID_19]: '#000000',
  [GameOfOrigin.INVALID_28]: '#000000',
  [GameOfOrigin.INVALID_29]: '#000000',
  [GameOfOrigin.INVALID_46]: '#000000',
  [GameOfOrigin.Red]: '#DA3914',
  [GameOfOrigin.BlueGreen]: '#2E50D8',
  [GameOfOrigin.BlueJapan]: '#2E50D8',
  [GameOfOrigin.Yellow]: '#FFD733',
  [GameOfOrigin.Gold]: '#DAA520',
  [GameOfOrigin.Silver]: '#C0C0C0 ',
  [GameOfOrigin.Crystal]: '#3D51A7',
  [GameOfOrigin.Ruby]: '#CD2236',
  [GameOfOrigin.Sapphire]: '#009652',
  [GameOfOrigin.Emerald]: '#009652',
  [GameOfOrigin.ColosseumXD]: '#604E82',
  [GameOfOrigin.FireRed]: '#F15C01 ',
  [GameOfOrigin.LeafGreen]: '#9FDC00',
  [GameOfOrigin.Diamond]: '#90BEED',
  [GameOfOrigin.Pearl]: '#DD7CB1',
  [GameOfOrigin.Platinum]: '#A0A08D',
  [GameOfOrigin.HeartGold]: '#E8B502',
  [GameOfOrigin.SoulSilver]: '#AAB9CF',
  [GameOfOrigin.Black]: '#444444',
  [GameOfOrigin.White]: '#E1E1E1',
  [GameOfOrigin.Black2]: '#303E51',
  [GameOfOrigin.White2]: '#EBC5C3',
  [GameOfOrigin.X]: '#025DA6',
  [GameOfOrigin.Y]: '#EA1A3E',
  [GameOfOrigin.OmegaRuby]: '#AB2813',
  [GameOfOrigin.AlphaSapphire]: '#26649C',
  [GameOfOrigin.GO]: '#000000',
  [GameOfOrigin.Sun]: '#F1912B',
  [GameOfOrigin.Moon]: '#5599CA',
  [GameOfOrigin.UltraSun]: '#E95B2B',
  [GameOfOrigin.UltraMoon]: '#226DB5',
  [GameOfOrigin.LetsGoPikachu]: '#F5DA26',
  [GameOfOrigin.LetsGoEevee]: '#D4924B',
  [GameOfOrigin.Sword]: '#00A1E9',
  [GameOfOrigin.Shield]: '#BF004F',
  [GameOfOrigin.BrilliantDiamond]: '#44BAE5',
  [GameOfOrigin.ShiningPearl]: '#DA7D99',
  [GameOfOrigin.LegendsArceus]: '#36597B',
  [GameOfOrigin.Scarlet]: '#F34134',
  [GameOfOrigin.Violet]: '#8334B7',
}
