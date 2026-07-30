import LabelledInput from '../input/LabelledInput'
import JvrFlex from '../OhoFlex'
import { PokemonSearchController } from './usePokemonSearch'

interface PokemonSearchFieldsProps {
  controller: PokemonSearchController
}

export function PokemonSearchFields({ controller }: PokemonSearchFieldsProps) {
  const { nickname, setNickname, knownMove, setKnownMove } = controller
  return (
    <JvrFlex.ColStart className="form-vertical">
      <LabelledInput.Text label="Nickname" value={nickname} onChange={setNickname} />
      <LabelledInput.Text label="Known Move" value={knownMove} onChange={setKnownMove} />
    </JvrFlex.ColStart>
  )
}

const SearchFields = {
  Pokemon: PokemonSearchFields,
}

export default SearchFields
