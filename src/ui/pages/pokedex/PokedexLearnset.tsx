import OhoFlex from '@openhome-ui/components/OhoFlex'
import MoveCard from '@openhome-ui/components/pokemon/MoveCard'
import { FormMetadata, MetadataSource } from '@pkm-rs/pkg'
import { Card, Flex, Text } from '@radix-ui/themes'
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
    <Card className="pokedex-learnset-card">
      <OhoFlex.ColStart className="pokedex-learnset-moves">
        <OhoFlex.ColStart>
          <h3>Levelup:</h3>
          {levelUpLearnset ? (
            levelUpLearnset.map((learnsetMove) => (
              <Flex
                className="learnset-move"
                key={`${learnsetMove.move_id}-${learnsetMove.level}`}
                align="center"
                gap="2"
              >
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
        </OhoFlex.ColStart>
        {metadataSource === MetadataSource.LegendsArceus && (
          <OhoFlex.ColStart>
            <h3>Mastered:</h3>
            {selectedForm.moveMasteryLa()?.map((learnsetMove) => (
              <Flex
                className="learnset-move"
                key={`${learnsetMove.moveId}-${learnsetMove.level}`}
                align="center"
                gap="2"
              >
                <p className="learnset-move-requirement">
                  {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
                </p>
                <MoveCard move={learnsetMove.moveId} compact />
              </Flex>
            ))}
          </OhoFlex.ColStart>
        )}
        {metadataSource === MetadataSource.LegendsZa && (
          <OhoFlex.ColStart>
            <h3>Plus Moves:</h3>
            {selectedForm.plusMovesLza()?.map((learnsetMove) => (
              <Flex
                className="learnset-move"
                key={`${learnsetMove.moveId}-${learnsetMove.level}`}
                align="center"
                gap="2"
              >
                <p className="learnset-move-requirement">
                  {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
                </p>
                <MoveCard move={learnsetMove.moveId} compact />
              </Flex>
            ))}
          </OhoFlex.ColStart>
        )}
      </OhoFlex.ColStart>
    </Card>
  )
}
