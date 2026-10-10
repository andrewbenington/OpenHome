import { getBaseEvolution } from '@openhome-core/pkm/util'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex'
import { ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon } from '@openhome-ui/components/Icons'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { MetadataSummaryLookup, SpeciesForm } from '@pkm-rs/pkg'
import { Flex } from '@radix-ui/themes'
import { Responsive } from '@radix-ui/themes/props'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormPokedexData } from './util'

const MONS_WITH_NON_EVOLVABLE_FORMS = [
  NationalDex.Floette,
  NationalDex.Ursaluna,
  NationalDex.Greninja,
]

export type EvolutionFamilyProps = {
  nationalDex: number
  formNumber: number
  pokedex: Pokedex
  height?: Responsive<string>
  onClick?: (nationalDex: number, formNumber: number) => void
}

export default function EvolutionFamily(props: EvolutionFamilyProps) {
  const { nationalDex, formNumber: formIndex, pokedex, height, onClick } = props
  let baseEvolution = getBaseEvolution(nationalDex, formIndex)

  if (MONS_WITH_NON_EVOLVABLE_FORMS.includes(nationalDex)) {
    // Ensures full family is shown even when forms like Ash Greninja are selected
    baseEvolution = getBaseEvolution(nationalDex, 0)
  }

  if (!baseEvolution) return <div />

  const baseEvolutionForms = baseEvolution.getSpeciesMetadata().forms

  if (MONS_WITH_NON_EVOLVABLE_FORMS.includes(nationalDex)) {
    const otherForms = SpeciesForm.tryNew(nationalDex, formIndex)
      ?.getSpeciesMetadata()
      .forms.filter((form) => !form.preEvolution && !form.isMega)

    if (otherForms) {
      baseEvolutionForms.push(...otherForms)
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
      {baseEvolutionForms
        .filter((form) => !form.isMega)
        .map(({ nationalDex, formIndex }) => (
          <EvolutionLine
            nationalDex={nationalDex}
            formNumber={formIndex}
            key={formIndex}
            pokedex={pokedex}
            onClick={onClick}
          />
        ))}
    </Flex>
  )
}

function EvolutionLine({ nationalDex, formNumber, pokedex, onClick }: EvolutionFamilyProps) {
  const formMetadata = MetadataSummaryLookup(nationalDex, formNumber)
  const evolutions = formMetadata?.evolutions ?? []
  const megaForms = formMetadata?.megaEvolutions ?? []

  if (evolutions.length === 8) {
    return (
      <Flex align="center" gap="2">
        <Flex direction="column" gap="2" align="center">
          {evolutions.slice(0, 4).map((evo, i) => (
            <Flex key={`${evo.nationalDex}-${evo.formIndex}`} align="center" gap="2">
              <EvolutionLine
                nationalDex={evo.nationalDex}
                formNumber={evo.formIndex}
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
          nationalDex={nationalDex}
          formIndex={formNumber}
          silhouette={
            !getFormPokedexData(pokedex, nationalDex, formNumber)?.level.includes('Caught')
          }
          onClick={() => onClick?.(nationalDex, formNumber)}
        />
        <Flex direction="column" gap="2">
          {evolutions.slice(4).map((evo, i) => (
            <Flex key={`${evo.nationalDex}-${evo.formIndex}`} align="center" gap="2">
              <ArrowRightIcon
                style={{
                  rotate: `${(1.5 - i) * -36}deg`,
                  marginTop: (1.5 - i) * 15,
                  marginBottom: (1.5 - i) * -15,
                }}
              />
              <EvolutionLine
                nationalDex={evo.nationalDex}
                formNumber={evo.formIndex}
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
        nationalDex={nationalDex}
        formIndex={formNumber}
        silhouette={!getFormPokedexData(pokedex, nationalDex, formNumber)?.level.includes('Caught')}
        onClick={() => onClick?.(nationalDex, formNumber)}
      />
      {!MetadataSummaryLookup(nationalDex, formNumber)?.regional && megaForms.length > 0 && (
        <Flex direction="column" gap="2">
          {megaForms.map((mega, i) => (
            <Flex key={`${nationalDex}-${mega.megaForm.formIndex}`} align="center" gap="2">
              <ArrowLeftRightIcon
                style={{
                  rotate: `${((megaForms.length - 1) / 2 - i) * -36}deg`,
                  marginTop: ((megaForms.length - 1) / 2 - i) * 15,
                  marginBottom: ((megaForms.length - 1) / 2 - i) * -15,
                }}
              />
              <TooltipPokemonIcon
                nationalDex={nationalDex}
                formIndex={mega.megaForm.formIndex}
                silhouette={
                  !getFormPokedexData(
                    pokedex,
                    nationalDex,
                    mega.megaForm.formIndex
                  )?.level.includes('Caught')
                }
                onClick={() => onClick?.(nationalDex, mega.megaForm.formIndex)}
              />
            </Flex>
          ))}
        </Flex>
      )}
      <Flex direction="column" gap="2">
        {evolutions.map((evo, i) => (
          <Flex key={`${evo.nationalDex}-${evo.formIndex}`} align="center" gap="2">
            <ArrowRightIcon
              style={{
                rotate: `${((evolutions.length - 1) / 2 - i) * -36}deg`,
                marginTop: ((evolutions.length - 1) / 2 - i) * 15,
                marginBottom: ((evolutions.length - 1) / 2 - i) * -15,
              }}
            />
            <EvolutionLine
              nationalDex={evo.nationalDex}
              formNumber={evo.formIndex}
              pokedex={pokedex}
              onClick={onClick}
            />
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
