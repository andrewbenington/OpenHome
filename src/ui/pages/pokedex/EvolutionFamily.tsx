import { getBaseMon } from '@openhome-core/pkm/util'
import { ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon } from '@openhome-ui/components/Icons'
import { MetadataLookup, SpeciesAndForme } from '@pkm-rs/pkg'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import { Flex } from '@radix-ui/themes'
import { Responsive } from '@radix-ui/themes/props'
import { Pokedex } from 'src/ui/util/pokedex'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormeStatus } from './util'

const MONS_WITH_NON_EVOLVABLE_FORMES = [
  NationalDex.Floette,
  NationalDex.Ursaluna,
  NationalDex.Greninja,
]

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
  let baseMon = getBaseMon(nationalDex, formeNumber)

  if (MONS_WITH_NON_EVOLVABLE_FORMES.includes(nationalDex)) {
    // Ensures full family is shown even when formes like Ash Greninja are selected
    baseMon = getBaseMon(nationalDex, 0)
  }

  if (!baseMon) return <div />

  const baseMonFormes = baseMon.getSpeciesMetadata().formes

  if (MONS_WITH_NON_EVOLVABLE_FORMES.includes(nationalDex)) {
    const otherFormes = SpeciesAndForme.tryNew(nationalDex, formeNumber)
      ?.getSpeciesMetadata()
      .formes.filter((forme) => !forme.preEvolution && !forme.isMega)

    if (otherFormes) {
      baseMonFormes.push(...otherFormes)
    }
  }

  return (
    <Flex
      direction="column"
      gap="2"
      height={height}
      justify="center"
      align="center"
      overflow="auto"
    >
      {baseMonFormes
        .filter((forme) => !forme.isMega)
        .map(({ nationalDex, formeIndex }) => (
          <EvolutionLine
            nationalDex={nationalDex.index}
            formeNumber={formeIndex}
            key={formeIndex}
            pokedex={pokedex}
            onClick={onClick}
          />
        ))}
    </Flex>
  )
}

function EvolutionLine({ nationalDex, formeNumber, pokedex, onClick }: EvolutionFamilyProps) {
  const formeMetadata = MetadataLookup(nationalDex, formeNumber)
  const evolutions = formeMetadata?.evolutions ?? []
  const megaFormes = formeMetadata?.megaEvolutions ?? []

  if (evolutions.length === 8) {
    return (
      <Flex align="center" gap="2">
        <Flex direction="column" gap="2" align="center">
          {evolutions.slice(0, 4).map((evo, i) => (
            <Flex key={`${evo.nationalDex}-${evo.formeIndex}`} align="center" gap="2">
              <EvolutionLine
                nationalDex={evo.nationalDex}
                formeNumber={evo.formeIndex}
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
        <TooltipPokemonIcon
          dexNumber={nationalDex}
          formeNumber={formeNumber}
          silhouette={!getFormeStatus(pokedex, nationalDex, formeNumber)?.includes('Caught')}
          onClick={() => onClick?.(nationalDex, formeNumber)}
        />
        <Flex direction="column" gap="2">
          {evolutions.slice(4).map((evo, i) => (
            <Flex key={`${evo.nationalDex}-${evo.formeIndex}`} align="center" gap="2">
              <ArrowRightIcon
                style={{
                  rotate: `${(1.5 - i) * -36}deg`,
                  marginTop: (1.5 - i) * 15,
                  marginBottom: (1.5 - i) * -15,
                }}
              />
              <EvolutionLine
                nationalDex={evo.nationalDex}
                formeNumber={evo.formeIndex}
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
      <TooltipPokemonIcon
        dexNumber={nationalDex}
        formeNumber={formeNumber}
        silhouette={!getFormeStatus(pokedex, nationalDex, formeNumber)?.includes('Caught')}
        onClick={() => onClick?.(nationalDex, formeNumber)}
      />
      {!MetadataLookup(nationalDex, formeNumber)?.regional && megaFormes.length > 0 && (
        <Flex direction="column" gap="2">
          {megaFormes.map((mega, i) => (
            <Flex key={`${nationalDex}-${mega.megaForme.formeIndex}`} align="center" gap="2">
              <ArrowLeftRightIcon
                style={{
                  rotate: `${((megaFormes.length - 1) / 2 - i) * -36}deg`,
                  marginTop: ((megaFormes.length - 1) / 2 - i) * 15,
                  marginBottom: ((megaFormes.length - 1) / 2 - i) * -15,
                }}
              />
              <TooltipPokemonIcon
                dexNumber={nationalDex}
                formeNumber={mega.megaForme.formeIndex}
                silhouette={
                  !getFormeStatus(pokedex, nationalDex, mega.megaForme.formeIndex)?.includes(
                    'Caught'
                  )
                }
                onClick={() => onClick?.(nationalDex, mega.megaForme.formeIndex)}
              />
            </Flex>
          ))}
        </Flex>
      )}
      <Flex direction="column" gap="2">
        {evolutions.map((evo, i) => (
          <Flex key={`${evo.nationalDex}-${evo.formeIndex}`} align="center" gap="2">
            <ArrowRightIcon
              style={{
                rotate: `${((evolutions.length - 1) / 2 - i) * -36}deg`,
                marginTop: ((evolutions.length - 1) / 2 - i) * 15,
                marginBottom: ((evolutions.length - 1) / 2 - i) * -15,
              }}
            />
            <EvolutionLine
              nationalDex={evo.nationalDex}
              formeNumber={evo.formeIndex}
              pokedex={pokedex}
              onClick={onClick}
            />
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
