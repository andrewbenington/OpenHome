import { FormMetadata, MetadataSource } from '@pkm-rs/pkg'
import { Flex, Text } from '@radix-ui/themes'
import MoveCard from 'src/ui/components/pokemon/MoveCard'
import './PokedexLearnset.css'
import { MOST_CURRENT_SOURCE, MostCurrentSource } from './PokedexPage'

interface PokedexLearnsetProps {
  selectedForm: FormMetadata
  metadataSource: MetadataSource | MostCurrentSource
}

export default function PokedexLearnset(props: PokedexLearnsetProps) {
  const { selectedForm, metadataSource } = props

  const levelUpLearnset = selectedForm.levelUpLearnset(
    metadataSource === MOST_CURRENT_SOURCE ? undefined : metadataSource
  )

  return (
    <div className="pokedex-learnset">
      {levelUpLearnset ? (
        levelUpLearnset.map((learnsetMove) => (
          <Flex key={`${learnsetMove.move_id}-${learnsetMove.level}`} align="center" gap="2">
            <p className="learnset-move-requirement">
              {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
            </p>
            <MoveCard move={learnsetMove.move_id} noPP />
          </Flex>
        ))
      ) : (
        <Flex width="100%" height="50%" align="center" justify="center">
          <Text>No level-up learnset data available for this form.</Text>
        </Flex>
      )}
    </div>
  )
}
