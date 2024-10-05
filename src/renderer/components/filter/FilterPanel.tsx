import { Button, Card, Stack, Typography } from '@mui/joy'
import {
  Ability,
  AbilityToString,
  Balls,
  GameOfOriginData,
  Item,
  ItemToString,
  Type,
  Types,
} from 'pokemon-resources'
import { PokemonData } from 'pokemon-species-data'
import { useContext, useMemo } from 'react'
import { OpenHomeRibbons } from 'src/consts'
import { getOriginMark } from 'src/renderer/images/game'
import { getRibbonSpritePath } from 'src/renderer/images/ribbons'
import { FilterContext } from 'src/renderer/state/filter'
import { getPublicImageURL } from '../../images/images'
import { BallsList, getItemIconPath } from '../../images/items'
import PokemonIcon from '../PokemonIcon'
import TypeIcon from '../TypeIcon'
import FilterAutocomplete from './FilterAutocomplete'

type SelectOption = {
  label: string
  id: number
}

export default function FilterPanel() {
  const [filterState, dispatchFilterState] = useContext(FilterContext)

  const currentMon = useMemo(
    () => (filterState.dexNumber ? PokemonData[filterState.dexNumber] : undefined),
    [filterState.dexNumber]
  )

  const items: SelectOption[] = useMemo(
    () =>
      Object.keys(Item)
        .filter((item) => isNaN(Number(item)))
        .map((item, id) => ({
          label: ItemToString(Item[item]),
          id,
        })),
    []
  )

  const abilities: SelectOption[] = useMemo(
    () =>
      Object.keys(Ability)
        .filter((ability) => isNaN(Number(ability)))
        .map((ability, id) => ({
          label: AbilityToString(Ability[ability]),
          id,
        })),
    []
  )

  return (
    <Card sx={{ marginLeft: 1 }}>
      <div style={{ display: 'flex', paddingTop: 4 }}>
        <Typography fontSize={20} marginLeft={0.5} flex={1}>
          Filter
        </Typography>
        <Button
          variant="outlined"
          disabled={Object.values(filterState).length === 0}
          color="danger"
          onClick={() => dispatchFilterState({ type: 'clear_all' })}
          style={{ padding: 4 }}
        >
          Clear All
        </Button>
      </div>
      <Stack margin={1} spacing={1}>
        <FilterAutocomplete
          options={Object.values(PokemonData)}
          groupBy={(option) => `Generation ${option.formes[0].gen}`}
          labelField="name"
          indexField="nationalDex"
          filterField="dexNumber"
          placeholder="Species"
          getOptionLabel={(option) => option.name}
          getIconComponent={(currentMon) => (
            <PokemonIcon
              dexNumber={currentMon.nationalDex}
              style={{ width: 32, height: 32, marginLeft: -4 }}
            />
          )}
        />
        {currentMon && currentMon.formes.length > 1 && (
          <FilterAutocomplete
            options={currentMon.formes}
            labelField="formeName"
            indexField="formeNumber"
            filterField="formeNumber"
            placeholder="Forme"
            getOptionLabel={(option) => option.formeName}
            getIconComponent={(currentForme) =>
              filterState.dexNumber ? (
                <PokemonIcon
                  dexNumber={filterState.dexNumber}
                  formeNumber={currentForme.formeNumber}
                  style={{ width: 32, height: 32, marginLeft: 0, marginRight: -4 }}
                />
              ) : undefined
            }
          />
        )}
        <FilterAutocomplete
          options={items}
          labelField="label"
          indexField="id"
          filterField="heldItemIndex"
          placeholder="Held Item"
          getIconComponent={(currentItem) =>
            currentItem && (
              <img
                alt="item icon"
                src={getPublicImageURL(getItemIconPath(currentItem.id, 'PK9'))}
                style={{ width: 24, height: 24 }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = getPublicImageURL(`items/index/0000.png`)
                }}
              />
            )
          }
        />
        <FilterAutocomplete
          options={abilities}
          labelField="label"
          indexField="id"
          filterField="abilityIndex"
          placeholder="Ability"
        />
        <FilterAutocomplete
          options={Types}
          filterField="type1"
          placeholder="Type 1"
          getIconComponent={(type) => <TypeIcon type={type} />}
        />
        {filterState.type1 && (
          <FilterAutocomplete
            options={Types.filter((type) => type !== filterState.type1)}
            filterField="type2"
            placeholder="Type 2"
            getIconComponent={(type: Type) => <TypeIcon type={type} />}
          />
        )}
        <FilterAutocomplete
          options={GameOfOriginData.filter((origin) => !!origin)}
          filterField="gameOfOrigin"
          labelField="name"
          indexField="index"
          placeholder="Game Of Origin"
          getOptionLabel={(option) => `Pokémon ${option?.name}`}
          getIconComponent={(origin) =>
            origin?.mark ? (
              <img
                draggable={false}
                alt="origin mark"
                style={{ width: 24, height: 24 }}
                src={getPublicImageURL(getOriginMark(origin?.mark))}
              />
            ) : undefined
          }
        />
        <FilterAutocomplete
          options={Balls.map((ball, id) => ({
            label: ball,
            id,
          }))}
          filterField="ball"
          labelField="label"
          indexField="id"
          placeholder="Ball"
          getIconComponent={(ball) => (
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsList[ball.id]}
            />
          )}
        />
        <FilterAutocomplete
          options={['Any', 'None', ...OpenHomeRibbons]}
          filterField="ribbon"
          placeholder="Ribbon"
          getIconComponent={(ribbon) =>
            ribbon !== 'Any' && ribbon !== 'None' ? (
              <img
                draggable={false}
                style={{ width: 24, height: 24 }}
                src={getPublicImageURL(getRibbonSpritePath(ribbon))}
              />
            ) : undefined
          }
        />
        <FilterAutocomplete
          options={['Shiny', 'Not Shiny', 'Square Shiny', 'Star Shiny']}
          filterField="shiny"
          placeholder="Shiny"
          getIconComponent={(value) =>
            value !== 'Not Shiny' ? (
              <img
                alt="shiny icon"
                draggable={false}
                src={getPublicImageURL('icons/Shiny.png')}
                style={{ width: 24, height: 24 }}
              />
            ) : undefined
          }
        />
      </Stack>
    </Card>
  )
}
