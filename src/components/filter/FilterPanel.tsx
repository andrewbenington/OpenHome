import {
  all_species_data,
  Generation,
  getAllAbilities,
  getAllBalls,
  getAllItems,
  ItemIndex,
  ItemMetadata,
  OriginGame,
  OriginGames,
  OriginGameWithData,
  SpeciesLookup,
} from '@pkm-rs-resources/pkg'
import { Types } from '@pokemon-resources/index'
import { Button, Flex, Text } from '@radix-ui/themes'
import { useContext, useMemo } from 'react'
import { OpenHomeRibbons } from 'src/consts/Ribbons'
import { getPublicImageURL } from 'src/images/images'
import { BallsImageList, getItemIconPath } from 'src/images/items'
import { getRibbonSpritePath } from 'src/images/ribbons'
import { FilterContext } from 'src/state/filter'
import { HeldItemCategory } from 'src/types/Filter'
import Autocomplete from '../Autocomplete'
import PokemonIcon from '../PokemonIcon'
import TypeIcon from '../TypeIcon'
import './style.css'

type SelectOption = {
  label: string
  id: number
}

type ItemOption =
  | ({
      type: 'specific_item'
    } & SelectOption)
  | {
      type: HeldItemCategory
      label: string
    }

function getOriginIcon(origin: OriginGameWithData) {
  const path =
    origin.generation === Generation.G4 || origin.generation === Generation.G5
      ? 'i/cons/ds.png'
      : origin.game === OriginGame.ColosseumXd
        ? '/icons/gcn.png'
        : origin.generation === Generation.G3
          ? '/icons/gba.png'
          : origin.mark
            ? `/origin_marks/${origin.mark}.png`
            : undefined

  return path ? (
    <img className="filter-icon invert-dark" draggable={false} alt="origin mark" src={path} />
  ) : undefined
}

function itemMetadataToSelectOption(metadata: ItemMetadata): SelectOption {
  return {
    label: metadata.name,
    id: metadata.id,
  }
}

function itemIndexToSelectOption(index: number): SelectOption {
  const parsed = ItemIndex.fromIndex(index)
  if (!parsed) return { id: index, label: '' }

  return itemMetadataToSelectOption(parsed.getMetadata())
}

export default function FilterPanel() {
  const [filterState, dispatchFilterState] = useContext(FilterContext)

  const ALL_SPECIES_DATA = useMemo(all_species_data, [])

  const ALL_ABILITIES: SelectOption[] = getAllAbilities().map(({ name, id }) => ({
    label: name,
    id,
  }))

  const ALL_BALLS: SelectOption[] = getAllBalls().map(({ name, index }) => ({
    label: name,
    id: index,
  }))

  const ALL_ITEMS: SelectOption[] = getAllItems().map(itemMetadataToSelectOption)

  const itemOptions: ItemOption[] = [
    {
      type: 'specific_item',
      id: 0,
      label: 'No Item',
    },
    {
      type: 'any',
      label: 'Any Item',
    },
    {
      type: 'mega_stone',
      label: 'Mega Stone',
    },
    {
      type: 'z_crystal',
      label: 'Z Crystal',
    },
    ...ALL_ITEMS.map((item) => ({ type: 'specific_item', ...item }) as ItemOption),
  ]

  const currentMon = useMemo(
    () => (filterState.dexNumber ? SpeciesLookup(filterState.dexNumber) : undefined),
    [filterState.dexNumber]
  )

  return (
    <div style={{ contain: 'none', padding: 4 }}>
      <Flex direction="row" justify="between" p="4px 4px 0px 4px">
        <Text size="3" weight="bold">
          Filter
        </Text>
        <Button
          variant="outline"
          disabled={Object.values(filterState).length === 0}
          color="tomato"
          onClick={() => dispatchFilterState({ type: 'clear_all' })}
          size="1"
        >
          Clear All
        </Button>
      </Flex>
      <Flex direction="column" m="1" gap="0">
        <Autocomplete
          options={Object.values(ALL_SPECIES_DATA)}
          getOptionString={(opt) => opt.name}
          getOptionUniqueID={(opt) => opt.nationalDex.toString()}
          value={filterState.dexNumber ? SpeciesLookup(filterState.dexNumber) : undefined}
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
            getOptionUniqueID={(opt) => opt.formeIndex.toString()}
            value={
              filterState.formeNumber !== undefined
                ? currentMon.formes[filterState.formeNumber]
                : undefined
            }
            label="Forme"
            onChange={(option) =>
              dispatchFilterState({
                type: 'set_filter',
                payload: { formeNumber: option?.formeIndex },
              })
            }
            getIconComponent={(currentForme) =>
              filterState.dexNumber &&
              currentForme && (
                <PokemonIcon
                  dexNumber={filterState.dexNumber}
                  formeNumber={currentForme.formeIndex}
                  style={{ width: 24, height: 24 }}
                />
              )
            }
          />
        )}
        <Autocomplete
          options={itemOptions}
          getOptionString={(opt) => opt.label}
          getOptionUniqueID={(opt) =>
            opt.type === 'specific_item' && opt.id ? opt.id.toString() : opt.type
          }
          value={
            typeof filterState.heldItem === 'number'
              ? {
                  type: 'specific_item',
                  ...itemIndexToSelectOption(filterState.heldItem),
                }
              : filterState.heldItem !== undefined
                ? itemOptions.find(
                    (opt) => opt.type !== 'specific_item' && opt.type === filterState.heldItem
                  )
                : undefined
          }
          label="Held Item"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: {
                heldItem:
                  option?.type === 'specific_item' ? option.id : (option?.type as HeldItemCategory),
              },
            })
          }
          getIconComponent={(currentItem) =>
            currentItem.type === 'specific_item' && (
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
          options={ALL_ABILITIES}
          getOptionString={(opt) => opt.label}
          getOptionUniqueID={(opt) => opt.id.toString()}
          value={
            filterState.ability !== undefined ? ALL_ABILITIES[filterState.ability - 1] : undefined
          }
          label="Ability"
          onChange={(option) =>
            dispatchFilterState({
              type: 'set_filter',
              payload: { ability: option?.id },
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
          options={OriginGames.allMetadata()}
          getOptionString={(option) => option?.name}
          getOptionUniqueID={(opt) => opt.game.toString()}
          value={
            filterState.gameOfOrigin ? OriginGames.getMetadata(filterState.gameOfOrigin) : undefined
          }
          label="Game Of Origin"
          onChange={(option) =>
            dispatchFilterState({ type: 'set_filter', payload: { gameOfOrigin: option?.game } })
          }
          getIconComponent={getOriginIcon}
        />
        <Autocomplete
          options={ALL_BALLS}
          getOptionString={(option) => option.label}
          getOptionUniqueID={(opt) => opt.id.toString()}
          value={filterState.ball ? ALL_BALLS[filterState.ball] : undefined}
          label="Ball"
          onChange={(option) =>
            dispatchFilterState({ type: 'set_filter', payload: { ball: option?.id } })
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
            dispatchFilterState({ type: 'set_filter', payload: { ribbon: option } })
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
            dispatchFilterState({ type: 'set_filter', payload: { shiny: option } })
          }
          getIconComponent={(value) =>
            value !== 'Not Shiny' ? (
              <img
                alt="shiny icon"
                draggable={false}
                src={getPublicImageURL('icons/Shiny.png')}
                className="filter-icon invert-light"
              />
            ) : undefined
          }
        />
      </Flex>
    </div>
  )
}
