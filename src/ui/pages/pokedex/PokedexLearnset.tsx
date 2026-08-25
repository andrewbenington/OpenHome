import MoveCard from '@openhome-ui/components/pokemon/MoveCard'
import { FormMetadata, MetadataSource } from '@pkm-rs/pkg'
import { Flex, Text } from '@radix-ui/themes'
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
      {metadataSource === MetadataSource.LegendsArceus && <h3>Learned:</h3>}
      {levelUpLearnset ? (
        levelUpLearnset.map((learnsetMove) => (
          <Flex key={`${learnsetMove.move_id}-${learnsetMove.level}`} align="center" gap="2">
            <p className="learnset-move-requirement">
              {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
            </p>
            <MoveCard move={learnsetMove.move_id} compact />
          </Flex>
        ))
      ) : (
        <Flex width="100%" height="50%" align="center" justify="center">
          <Text>No level-up learnset data available for this form.</Text>
        </Flex>
      )}
      {metadataSource === MetadataSource.LegendsArceus && (
        <>
          <h3>Mastered:</h3>
          {selectedForm.moveMasteryLa()?.map((learnsetMove) => (
            <Flex key={`${learnsetMove.moveId}-${learnsetMove.level}`} align="center" gap="2">
              <p className="learnset-move-requirement">
                {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
              </p>
              <MoveCard move={learnsetMove.moveId} compact />
            </Flex>
          ))}
        </>
      )}
      {metadataSource === MetadataSource.LegendsZa && (
        <>
          <h3>Plus Moves:</h3>
          {selectedForm.plusMovesLza()?.map((learnsetMove) => (
            <Flex key={`${learnsetMove.moveId}-${learnsetMove.level}`} align="center" gap="2">
              <p className="learnset-move-requirement">
                {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
              </p>
              <MoveCard move={learnsetMove.moveId} compact />
            </Flex>
          ))}
        </>
      )}
    </div>
  )
}
