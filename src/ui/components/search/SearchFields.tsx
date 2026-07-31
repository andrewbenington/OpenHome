import { getOriginIconPath } from '@openhome-ui/images/game'
import { OriginGames, OriginGameWithData } from '@pkm-rs/pkg'
import LabelledInput from '../input/LabelledInput'
import JvrFlex from '../OhoFlex'
import { PokemonSearchController } from './usePokemonSearch'

interface PokemonSearchFieldsProps {
  controller: PokemonSearchController
}

export function PokemonSearchFields({ controller }: PokemonSearchFieldsProps) {
  const { nickname, setNickname, knownMove, setKnownMove, originGame, setOriginGame } = controller
  return (
    <JvrFlex.RowStart className="form-vertical">
      <LabelledInput.Text label="Nickname" value={nickname} onChange={setNickname} />
      <LabelledInput.Text label="Known Move" value={knownMove} onChange={setKnownMove} />
      <LabelledInput.Typeahead
        uniqueFieldId="origin_game"
        label="Origin Game"
        placeholder="Origin Game"
        options={OriginGames.allMetadata()}
        getOptionString={(option) => option?.name}
        getOptionUniqueID={(opt) => opt.game.toString()}
        value={originGame ? OriginGames.getMetadata(originGame) : undefined}
        onChange={(option) => setOriginGame(option?.game || null)}
        getIconComponent={getOriginIcon}
      />
    </JvrFlex.RowStart>
  )
}

const ICON_SIZE = 18
function getOriginIcon(origin: OriginGameWithData) {
  const path = getOriginIconPath(origin)

  return path ? (
    <img
      className="filter-icon white-filter"
      draggable={false}
      alt="origin mark"
      src={path}
      style={{ width: ICON_SIZE, height: ICON_SIZE }}
    />
  ) : undefined
}

const SearchFields = {
  Pokemon: PokemonSearchFields,
}

export default SearchFields
