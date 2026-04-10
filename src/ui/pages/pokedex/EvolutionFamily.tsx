import { getBaseMon } from '@openhome-core/pkm/util'
import { ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon } from '@openhome-ui/components/Icons'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { MetadataSummaryLookup, SpeciesAndForm } from '@pkm-rs/pkg'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import { Flex } from '@radix-ui/themes'
import { Responsive } from '@radix-ui/themes/props'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormeStatus } from './util'

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
  onClick?: (nationalDex: number, formeNumber: number) => void
}

export default function EvolutionFamily({
  nationalDex,
  formNumber: formIndex,
  pokedex,
  height,
  onClick,
}: EvolutionFamilyProps) {
  let baseMon = getBaseMon(nationalDex, formIndex)

  if (MONS_WITH_NON_EVOLVABLE_FORMS.includes(nationalDex)) {
    // Ensures full family is shown even when forms like Ash Greninja are selected
    baseMon = getBaseMon(nationalDex, 0)
  }

  if (!baseMon) return <div />

  const baseMonForms = baseMon.getSpeciesMetadata().forms

  if (MONS_WITH_NON_EVOLVABLE_FORMS.includes(nationalDex)) {
    const otherForms = SpeciesAndForm.tryNew(nationalDex, formIndex)
      ?.getSpeciesMetadata()
      .forms.filter((form) => !form.preEvolution && !form.isMega)

    if (otherForms) {
      baseMonForms.push(...otherForms)
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
      {baseMonForms
        .filter((form) => !form.isMega)
        .map(({ nationalDex, formIndex }) => (
          <EvolutionLine
            nationalDex={nationalDex.index}
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
  const formeMetadata = MetadataSummaryLookup(nationalDex, formNumber)
  const evolutions = formeMetadata?.evolutions ?? []
  const megaFormes = formeMetadata?.megaEvolutions ?? []

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
          dexNumber={nationalDex}
          formeNumber={formNumber}
          silhouette={!getFormeStatus(pokedex, nationalDex, formNumber)?.includes('Caught')}
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
        dexNumber={nationalDex}
        formeNumber={formNumber}
        silhouette={!getFormeStatus(pokedex, nationalDex, formNumber)?.includes('Caught')}
        onClick={() => onClick?.(nationalDex, formNumber)}
      />
      {!MetadataSummaryLookup(nationalDex, formNumber)?.regional && megaFormes.length > 0 && (
        <Flex direction="column" gap="2">
          {megaFormes.map((mega, i) => (
            <Flex key={`${nationalDex}-${mega.megaForme.formIndex}`} align="center" gap="2">
              <ArrowLeftRightIcon
                style={{
                  rotate: `${((megaFormes.length - 1) / 2 - i) * -36}deg`,
                  marginTop: ((megaFormes.length - 1) / 2 - i) * 15,
                  marginBottom: ((megaFormes.length - 1) / 2 - i) * -15,
                }}
              />
              <TooltipPokemonIcon
                dexNumber={nationalDex}
                formeNumber={mega.megaForme.formIndex}
                silhouette={
                  !getFormeStatus(pokedex, nationalDex, mega.megaForme.formIndex)?.includes(
                    'Caught'
                  )
                }
                onClick={() => onClick?.(nationalDex, mega.megaForme.formIndex)}
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
