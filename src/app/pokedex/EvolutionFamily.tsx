import { Flex } from '@radix-ui/themes'
import { Responsive } from '@radix-ui/themes/props'
import { PokemonData } from 'pokemon-species-data'
import { ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon } from 'src/components/Icons'
import PokemonIcon, { PokemonIconProps } from 'src/components/PokemonIcon'
import { getBaseMon } from 'src/types/pkm/util'
import { Pokedex } from 'src/types/pokedex'
import { getFormeStatus } from './util'

const ICON_SIZE = 32

export type EvolutionFamilyProps = {
  nationalDex: number
  formeNumber: number
  pokedex: Pokedex
  height?: Responsive<string>
  onClick?: (nationalDex: number, formeNumber: number) => void
}

export default function EvolutionFamily({
  nationalDex,
  formeNumber,
  pokedex,
  height,
  onClick,
}: EvolutionFamilyProps) {
  const baseMon = getBaseMon(nationalDex, formeNumber)
  const baseMonFormes = PokemonData[baseMon.dexNumber].formes

  return (
    <Flex
      direction="column"
      gap="4"
      height={height}
      justify="center"
      align="center"
      overflow="auto"
    >
      {baseMonFormes
        .filter((forme) => !forme.isMega)
        .map(({ formeNumber }) => (
          <EvolutionLine
            nationalDex={baseMon.dexNumber}
            formeNumber={formeNumber}
            key={formeNumber}
            pokedex={pokedex}
            onClick={onClick}
          />
        ))}
    </Flex>
  )
}

function EvolutionLine({ nationalDex, formeNumber, pokedex, onClick }: EvolutionFamilyProps) {
  const evolutions = PokemonData[nationalDex].formes[formeNumber].evos
  const megaFormes = PokemonData[nationalDex].formes.filter((f) => f.isMega)

  if (evolutions.length === 8) {
    return (
      <Flex align="center" gap="2">
        <Flex direction="column" gap="2" align="center">
          {evolutions.slice(0, 4).map((evo, i) => (
            <Flex key={`${evo.dexNumber}-${evo.formeNumber}`} align="center" gap="2">
              <EvolutionLine
                nationalDex={evo.dexNumber}
                formeNumber={evo.formeNumber}
                pokedex={pokedex}
                onClick={onClick}
              />
              <ArrowLeftIcon
                style={{
                  rotate: `${(1.5 - i) * 28}deg`,
                  marginTop: (1.5 - i) * 15,
                  marginBottom: (1.5 - i) * -15,
                }}
              />
            </Flex>
          ))}
        </Flex>
        <EvoLinePokemonIcon
          dexNumber={nationalDex}
          formeNumber={formeNumber}
          silhouette={!getFormeStatus(pokedex, nationalDex, formeNumber)?.includes('Caught')}
          onClick={() => onClick?.(nationalDex, formeNumber)}
        />
        <Flex direction="column" gap="2">
          {evolutions.slice(4).map((evo, i) => (
            <Flex key={`${evo.dexNumber}-${evo.formeNumber}`} align="center" gap="2">
              <ArrowRightIcon
                style={{
                  rotate: `${(1.5 - i) * -36}deg`,
                  marginTop: (1.5 - i) * 15,
                  marginBottom: (1.5 - i) * -15,
                }}
              />
              <EvolutionLine
                nationalDex={evo.dexNumber}
                formeNumber={evo.formeNumber}
                pokedex={pokedex}
                onClick={onClick}
              />
            </Flex>
          ))}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex align="center" gap="2">
      <EvoLinePokemonIcon
        dexNumber={nationalDex}
        formeNumber={formeNumber}
        silhouette={!getFormeStatus(pokedex, nationalDex, formeNumber)?.includes('Caught')}
        onClick={() => onClick?.(nationalDex, formeNumber)}
      />
      {!PokemonData[nationalDex].formes[formeNumber].regional && megaFormes.length > 0 && (
        <Flex direction="column" gap="2">
          {megaFormes.map((mega, i) => (
            <Flex key={`${nationalDex}-${mega.formeNumber}`} align="center" gap="2">
              <ArrowLeftRightIcon
                style={{
                  rotate: `${((megaFormes.length - 1) / 2 - i) * -36}deg`,
                  marginTop: ((megaFormes.length - 1) / 2 - i) * 15,
                  marginBottom: ((megaFormes.length - 1) / 2 - i) * -15,
                }}
              />
              <EvoLinePokemonIcon
                dexNumber={nationalDex}
                formeNumber={mega.formeNumber}
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
                silhouette={
                  !getFormeStatus(pokedex, nationalDex, mega.formeNumber)?.includes('Caught')
                }
              />
            </Flex>
          ))}
        </Flex>
      )}
      <Flex direction="column" gap="2">
        {evolutions.map((evo, i) => (
          <Flex key={`${evo.dexNumber}-${evo.formeNumber}`} align="center" gap="2">
            <ArrowRightIcon
              style={{
                rotate: `${((evolutions.length - 1) / 2 - i) * -36}deg`,
                marginTop: ((evolutions.length - 1) / 2 - i) * 15,
                marginBottom: ((evolutions.length - 1) / 2 - i) * -15,
              }}
            />
            <EvolutionLine
              nationalDex={evo.dexNumber}
              formeNumber={evo.formeNumber}
              pokedex={pokedex}
              onClick={onClick}
            />
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

type EvoLinePokemonIconProps = PokemonIconProps & {
  onClick?: (nationalDex: number, formeNumber: number) => void
}

function EvoLinePokemonIcon(props: EvoLinePokemonIconProps) {
  const { onClick, ...pkmIconProps } = props

  return (
    <PokemonIcon
      {...pkmIconProps}
      onClick={() => onClick?.(props.dexNumber, props.formeNumber ?? 0)}
      style={{
        ...props.style,
        width: ICON_SIZE,
        height: ICON_SIZE,
        cursor: onClick ? 'pointer' : undefined,
      }}
    />
  )
}
