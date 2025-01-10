import { Button, Card, Flex, Text } from '@radix-ui/themes'
import { Ability, Balls, GameOfOriginData, Item, ItemToString, Types } from 'pokemon-resources'
import { PokemonData } from 'pokemon-species-data'
import { useContext, useMemo } from 'react'
import { OpenHomeRibbons } from 'src/consts/Ribbons'
import { getOriginMark } from 'src/images/game'
import { getPublicImageURL } from 'src/images/images'
import { BallsImageList, getItemIconPath } from 'src/images/items'
import { getRibbonSpritePath } from 'src/images/ribbons'
import { FilterContext } from 'src/state/filter'
import Autocomplete from '../Autocomplete'
import PokemonIcon from '../PokemonIcon'
import TypeIcon from '../TypeIcon'

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

  // TypeScript enums are difficult to work with...
  const items: SelectOption[] = useMemo(
    () =>
      Object.keys(Item)
        .filter((indexStr) => !isNaN(Number(indexStr)))
        .map((indexStr) => ({
          label: ItemToString(parseInt(indexStr)),
          id: parseInt(indexStr),
        })),
    []
  )

  const abilities: SelectOption[] = useMemo(
    () =>
      Object.keys(Ability)
        .filter((ability) => isNaN(Number(ability)))
        .map((ability, id) => ({
          label: ability,
          id,
        })),
    []
  )

  return (
    <Card style={{ contain: 'none' }}>
      <Flex direction="row" justify="between">
        <Text size="5" ml="1" weight="bold">
          Filter
        </Text>
        <Button
          variant="outline"
          disabled={Object.values(filterState).length === 0}
          color="tomato"
          onClick={() => dispatchFilterState({ type: 'clear_all' })}
          style={{ padding: 4 }}
        >
          Clear All
        </Button>
      </Flex>
      <Flex direction="column" m="1" gap="0">
        <Autocomplete
          options={Object.values(PokemonData)}
          getOptionString={(opt) => opt.name}
          getOptionUniqueID={(opt) => opt.nationalDex.toString()}
          value={filterState.dexNumber ? PokemonData[filterState.dexNumber] : undefined}
          label="Species"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { dexNumber: option?.nationalDex },
            })
          }
          getIconComponent={(currentMon) => (
            <PokemonIcon dexNumber={currentMon.nationalDex} style={{ width: 24, height: 24 }} />
          )}
        />
        {currentMon && currentMon.formes.length > 1 && (
          <Autocomplete
            options={[...currentMon.formes]}
            getOptionString={(opt) => opt.formeName}
            getOptionUniqueID={(opt) => opt.formeNumber.toString()}
            value={
              filterState.formeNumber !== undefined
                ? currentMon.formes[filterState.formeNumber]
                : undefined
            }
            label="Forme"
            onChange={(option) =>
              dispatchFilterState({
                type: 'set_filter',
                payload: { formeNumber: option?.formeNumber },
              })
            }
            getIconComponent={(currentForme) =>
              filterState.dexNumber &&
              currentForme && (
                <PokemonIcon
                  dexNumber={filterState.dexNumber}
                  formeNumber={currentForme.formeNumber}
                  style={{ width: 24, height: 24 }}
                />
              )
            }
          />
        )}
        <Autocomplete
          options={items}
          getOptionString={(opt) => opt.label}
          getOptionUniqueID={(opt) => opt.id.toString()}
          value={
            filterState.heldItemIndex !== undefined ? items[filterState.heldItemIndex] : undefined
          }
          label="Held Item"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { heldItemIndex: option?.id },
            })
          }
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
        <Autocomplete
          options={abilities}
          getOptionString={(opt) => opt.label}
          getOptionUniqueID={(opt) => opt.id.toString()}
          value={
            filterState.abilityIndex !== undefined ? abilities[filterState.abilityIndex] : undefined
          }
          label="Ability"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { abilityIndex: option?.id },
            })
          }
        />
        <Autocomplete
          options={Types}
          getOptionString={(opt) => opt}
          getOptionUniqueID={(opt) => opt}
          value={filterState.type1}
          label="Type 1"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { type1: option },
            })
          }
          getIconComponent={(type) => <TypeIcon type={type} />}
        />
        {filterState.type1 && (
          <Autocomplete
            options={Types}
            getOptionString={(opt) => opt}
            getOptionUniqueID={(opt) => opt}
            value={filterState.type2}
            label="Type 2"
            onChange={(option) =>
              dispatchFilterState({
                type: 'set_filter',
                payload: { type2: option },
              })
            }
            getIconComponent={(type) => <TypeIcon type={type} />}
          />
        )}
        <Autocomplete
          options={GameOfOriginData.filter((origin) => !!origin)}
          getOptionString={(option) => option?.name}
          getOptionUniqueID={(opt) => opt.index.toString()}
          value={
            filterState.gameOfOrigin
              ? GameOfOriginData.find((origin) => origin?.index === filterState.gameOfOrigin)
              : undefined
          }
          label="Game Of Origin"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { gameOfOrigin: option?.index },
            })
          }
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
        <Autocomplete
          options={Balls.map((ball, id) => ({
            label: ball,
            id,
          }))}
          getOptionString={(option) => option.label}
          getOptionUniqueID={(opt) => opt.id.toString()}
          value={
            filterState.ball ? { label: Balls[filterState.ball], id: filterState.ball } : undefined
          }
          label="Ball"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { ball: option?.id },
            })
          }
          getIconComponent={(ball) => (
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsImageList[ball.id]}
            />
          )}
        />
        <Autocomplete
          options={['Any Ribbon', 'No Ribbon', ...OpenHomeRibbons]}
          getOptionString={(opt) => opt}
          getOptionUniqueID={(opt) => opt}
          value={filterState.ribbon}
          label="Ribbon"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { ribbon: option },
            })
          }
          getIconComponent={(ribbon) =>
            ribbon !== 'Any Ribbon' && ribbon !== 'No Ribbon' ? (
              <img
                draggable={false}
                style={{ width: 24, height: 24 }}
                src={getPublicImageURL(getRibbonSpritePath(ribbon))}
              />
            ) : undefined
          }
        />
        <Autocomplete
          options={['Shiny', 'Not Shiny', 'Square Shiny', 'Star Shiny']}
          getOptionString={(opt) => opt}
          getOptionUniqueID={(opt) => opt}
          value={filterState.shiny}
          label="Shiny"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { shiny: option },
            })
          }
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
      </Flex>
    </Card>
  )
}
