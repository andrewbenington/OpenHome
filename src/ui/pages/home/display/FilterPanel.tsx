import { stringSorter } from '@openhome-core/util/sort'
import { displayGender } from '@openhome-core/util/types'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { BallsImageList, getItemIconPath } from '@openhome-ui/images/items'
import { getRibbonSpritePath } from '@openhome-ui/images/ribbons'
import { HeldItemCategory } from '@openhome-ui/util/filter'
import {
  all_species_data,
  Gender,
  getAllAbilities,
  getAllBalls,
  getAllItems,
  Item,
  ItemMetadata,
  OriginGames,
  OriginGameWithData,
  SpeciesLookup,
} from '@pkm-rs/pkg'
import { OpenHomeRibbons } from '@pokemon-resources/consts/Ribbons'
import { Types } from '@pokemon-resources/index'
import { Button, Flex } from '@radix-ui/themes'
import { useMemo } from 'react'
import { useMonDisplay } from 'src/ui/hooks/useMonDisplay'
import { getOriginIconPath } from 'src/ui/images/game'
import Autocomplete from '../../../components/Autocomplete'
import GenderIcon from '../../../components/pokemon/GenderIcon'
import TypeIcon from '../../../components/pokemon/TypeIcon'
import PokemonIcon from '../../../components/PokemonIcon'
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
  const path = getOriginIconPath(origin)

  return path ? (
    <img className="filter-icon white-filter" draggable={false} alt="origin mark" src={path} />
  ) : undefined
}

function itemMetadataToSelectOption(metadata: ItemMetadata): SelectOption {
  return {
    label: metadata.name,
    id: metadata.id,
  }
}

function itemIndexToSelectOption(index: number): SelectOption {
  const item = Item.fromIndex(index)
  if (!item) return { id: index, label: '' }

  return itemMetadataToSelectOption(item.getMetadata())
}

const allGenders = [Gender.Male, Gender.Female, Gender.Genderless].map((gender) => ({
  gender,
}))

export default function FilterPanel() {
  const { filter, setFilter, clearFilter } = useMonDisplay()

  const ALL_SPECIES_DATA = useMemo(all_species_data, [])

  const ALL_ABILITIES: SelectOption[] = getAllAbilities()
    .sort(stringSorter((a) => a.name))
    .map(({ name, id }) => ({
      label: name,
      id,
    }))

  const ALL_BALLS: SelectOption[] = getAllBalls()
    .sort(stringSorter((b) => b.name))
    .map(({ name, index }) => ({
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
    () => (filter.dexNumber ? SpeciesLookup(filter.dexNumber) : undefined),
    [filter.dexNumber]
  )

  return (
    <div style={{ contain: 'none', padding: 4 }}>
      <Flex direction="column" m="1" gap="0">
        <Autocomplete
          options={Object.values(ALL_SPECIES_DATA)}
          getOptionString={(opt) => opt.name}
          getOptionUniqueID={(opt) => opt.nationalDex.toString()}
          value={filter.dexNumber ? SpeciesLookup(filter.dexNumber) : undefined}
          label="Species"
          onChange={(option) => setFilter({ dexNumber: option?.nationalDex })}
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
              filter.formeNumber !== undefined ? currentMon.formes[filter.formeNumber] : undefined
            }
            label="Forme"
            onChange={(option) => setFilter({ formeNumber: option?.formeIndex })}
            getIconComponent={(currentForme) =>
              filter.dexNumber &&
              currentForme && (
                <PokemonIcon
                  dexNumber={filter.dexNumber}
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
            typeof filter.heldItem === 'number'
              ? {
                  type: 'specific_item',
                  ...itemIndexToSelectOption(filter.heldItem),
                }
              : filter.heldItem !== undefined
                ? itemOptions.find(
                    (opt) => opt.type !== 'specific_item' && opt.type === filter.heldItem
                  )
                : undefined
          }
          label="Held Item"
          onChange={(option) =>
            setFilter({
              heldItem:
                option?.type === 'specific_item' ? option.id : (option?.type as HeldItemCategory),
            })
          }
          getIconComponent={(currentItem) =>
            currentItem.type === 'specific_item' && (
              <img
                alt="item icon"
                src={getPublicImageURL(getItemIconPath(currentItem.id))}
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
            filter.ability !== undefined
              ? ALL_ABILITIES.find((a) => a.id === filter.ability)
              : undefined
          }
          label="Ability"
          onChange={(option) => setFilter({ ability: option?.id })}
        />
        <Autocomplete
          options={Types}
          getOptionString={(opt) => opt}
          getOptionUniqueID={(opt) => opt}
          value={filter.type1}
          label="Type 1"
          onChange={(option) => setFilter({ type1: option })}
          getIconComponent={(type) => <TypeIcon type={type} />}
        />
        {filter.type1 && (
          <Autocomplete
            options={Types}
            getOptionString={(opt) => opt}
            getOptionUniqueID={(opt) => opt}
            value={filter.type2}
            label="Type 2"
            onChange={(option) => setFilter({ type2: option })}
            getIconComponent={(type) => <TypeIcon type={type} />}
          />
        )}
        <Autocomplete
          options={OriginGames.allMetadata()}
          getOptionString={(option) => option?.name}
          getOptionUniqueID={(opt) => opt.game.toString()}
          value={filter.gameOfOrigin ? OriginGames.getMetadata(filter.gameOfOrigin) : undefined}
          label="Game Of Origin"
          onChange={(option) => setFilter({ gameOfOrigin: option?.game })}
          getIconComponent={getOriginIcon}
        />
        <Autocomplete
          options={ALL_BALLS}
          getOptionString={(option) => option.label}
          getOptionUniqueID={(opt) => opt.id.toString()}
          value={
            filter.ball !== undefined ? ALL_BALLS.find((a) => a.id === filter.ball) : undefined
          }
          label="Ball"
          onChange={(option) => setFilter({ ball: option?.id })}
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
          options={allGenders}
          getOptionString={(opt) => displayGender(opt.gender)}
          getOptionUniqueID={(opt) => opt.gender.toString()}
          value={filter.gender !== undefined ? { gender: filter.gender } : undefined}
          label="Gender"
          onChange={(option) => setFilter({ gender: option?.gender })}
          getIconComponent={(opt) => <GenderIcon gender={opt.gender} />}
        />
        <Autocomplete
          options={['Any Ribbon', 'No Ribbon', ...OpenHomeRibbons]}
          getOptionString={(opt) => opt}
          getOptionUniqueID={(opt) => opt}
          value={filter.ribbon}
          label="Ribbon"
          onChange={(option) => setFilter({ ribbon: option })}
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
          value={filter.shiny}
          label="Shiny"
          onChange={(option) => setFilter({ shiny: option })}
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
        <Button
          variant="outline"
          disabled={Object.values(filter).length === 0}
          color="tomato"
          onClick={clearFilter}
          size="1"
          mt="1"
        >
          Clear All
        </Button>
      </Flex>
    </div>
  )
}
