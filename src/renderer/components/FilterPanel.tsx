import { Autocomplete, Card, MenuItem, Stack, TextField } from '@mui/material'
import { Ability, AbilityToString, Item, ItemToString } from 'pokemon-resources'
import { useMemo, useState } from 'react'
import { POKEMON_DATA } from 'src/consts'
import { Forme, Pokemon, Styles } from 'src/types/types'
import BoxIcons from '../images/BoxIcons.png'
import { getPublicImageURL } from '../images/images'
import { getItemIconPath } from '../images/items'

const styles = {
  fillContainer: { minWidth: 32, height: 32, position: 'relative', marginRight: 8 },
  button: {
    padding: 0,
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    border: 'none',
    borderRadius: 3,
    textAlign: 'center',
  },
  background: {
    background: `url(${BoxIcons}) no-repeat 0.02777% 0.02777%`,
    backgroundSize: '3600%',
    imageRendering: 'crisp-edges',
    height: '100%',
    width: '100%',
    zIndex: 1,
    top: 0,
    left: 0,
    position: 'absolute',
  },
} as Styles

type Option = {
  label: string
  id: number
}

export default function FilterPanel() {
  const [species, setSpecies] = useState<Pokemon | null>(null)
  const [forme, setForme] = useState<Forme | null>(null)
  const [item, setItem] = useState<Option | null>(null)
  const [ability, setAbility] = useState<Option | null>(null)

  const items: Option[] = useMemo(
    () =>
      Object.keys(Item)
        .filter((item) => isNaN(Number(item)))
        .map((item, id) => ({
          label: ItemToString(Item[item]),
          id,
        })),
    []
  )

  const abilities: Option[] = useMemo(
    () =>
      Object.keys(Ability)
        .filter((ability) => isNaN(Number(ability)))
        .map((ability, id) => ({
          label: AbilityToString(Ability[ability]),
          id,
        })),
    []
  )

  const getBackgroundPosition = (mon: { dexNum: number; formNum: number }) => {
    if (!POKEMON_DATA[mon.dexNum].formes[mon.formNum]) {
      console.log(mon.formNum)
      return '0% 0%'
    }
    const [x, y] = POKEMON_DATA[mon.dexNum].formes[mon.formNum].spriteIndex
    return `${(x / 35) * 100}% ${(y / 36) * 100}%`
  }

  return (
    <Card sx={{ marginLeft: 1 }}>
      <Stack margin={1} spacing={1}>
        <Autocomplete
          size="small"
          value={species}
          isOptionEqualToValue={(option, value) => option.nationalDex === value.nationalDex}
          options={Object.values(POKEMON_DATA)}
          onChange={(_, newValue) => {
            setForme(null)
            if (newValue === null) {
              setSpecies(newValue)
            } else if (newValue && typeof newValue !== 'string' && 'nationalDex' in newValue) {
              setSpecies(newValue as Pokemon)
            }
          }}
          freeSolo
          renderInput={(params) => <TextField {...params} label="Species" />}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
          renderOption={(props, mon) => (
            <MenuItem
              {...props}
              key={mon.nationalDex}
              style={{ display: 'flex', flexDirection: 'row' }}
            >
              <div style={styles.fillContainer}>
                <div
                  style={{
                    ...styles.background,
                    backgroundPosition: getBackgroundPosition({
                      dexNum: mon.nationalDex,
                      formNum: 0,
                    }),
                  }}
                />
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {mon.name}
              </div>
            </MenuItem>
          )}
        />
        {species && species.formes.length > 1 && (
          <Autocomplete
            size="small"
            value={forme}
            isOptionEqualToValue={(option, value) => option.formeNumber === value.formeNumber}
            options={species.formes}
            onChange={(_, newValue) => {
              if (newValue === null) {
                setForme(newValue)
              } else if (newValue && typeof newValue !== 'string' && 'nationalDex' in newValue) {
                setForme(newValue as Forme)
              }
            }}
            freeSolo
            renderInput={(params) => <TextField {...params} label="Forme" />}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.formeName)}
            renderOption={(props, f) => (
              <MenuItem
                {...props}
                key={f.formeName}
                style={{ display: 'flex', flexDirection: 'row' }}
              >
                <div style={styles.fillContainer}>
                  <div
                    style={{
                      ...styles.background,
                      backgroundPosition: getBackgroundPosition({
                        dexNum: species.nationalDex,
                        formNum: f.formeNumber,
                      }),
                    }}
                  />
                </div>
                {f.formeName}
              </MenuItem>
            )}
          />
        )}
        <Autocomplete
          size="small"
          value={item}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          options={items}
          onChange={(_, newValue) => {
            if (newValue instanceof Option) {
              setItem(newValue as Option)
            }
          }}
          freeSolo
          renderInput={(params) => <TextField {...params} label="Item" />}
          renderOption={(props, options) => (
            <MenuItem {...props}>
              <img
                alt="item icon"
                src={getPublicImageURL(getItemIconPath(options.id, 'PK9'))}
                style={{ width: 24, height: 24, marginRight: 5 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getPublicImageURL(`items/index/0000.png`)
                }}
              />
              {options.label}
            </MenuItem>
          )}
        />
        <Autocomplete
          size="small"
          value={ability}
          onChange={(_, newValue) => {
            if (newValue instanceof Option) {
              setAbility(newValue as Option)
            }
          }}
          freeSolo
          isOptionEqualToValue={(option, value) => option.id === value.id}
          options={abilities}
          renderInput={(params) => <TextField {...params} label="Ability" />}
          renderOption={(props, options) => <MenuItem {...props}>{options.label}</MenuItem>}
        />
      </Stack>
    </Card>
  )
}
