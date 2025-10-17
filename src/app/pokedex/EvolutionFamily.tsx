import { MetadataLookup, SpeciesAndForme, SpeciesLookup } from '@pkm-rs-resources/pkg'
import { Flex } from '@radix-ui/themes'
import { Responsive } from '@radix-ui/themes/props'
import { ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon } from 'src/components/Icons'
import { BLOOD_MOON } from 'src/consts/Formes'
import { NationalDex } from 'src/consts/NationalDex'
import { getBaseMon } from 'src/types/pkm/util'
import { Pokedex } from 'src/types/pokedex'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormeStatus } from './util'

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

  if (nationalDex === NationalDex.Ursaluna) {
    // Include Teddiursa line for Ursaluna Bloodmoon
    baseMon = SpeciesAndForme.tryNew(NationalDex.Teddiursa, 0)
  }

  if (!baseMon) return <div />

  const baseMonFormes = baseMon.getSpeciesMetadata().formes

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
        .map(({ formeIndex }) => (
          <EvolutionLine
            nationalDex={baseMon.nationalDex}
            formeNumber={formeIndex}
            key={formeIndex}
            pokedex={pokedex}
            onClick={onClick}
          />
        ))}
      {baseMon.nationalDex === NationalDex.Teddiursa && (
        // Workaround for evo lines where one forme have a prevo and another doesn't, currently
        // only Ursaluna
        <EvolutionLine
          nationalDex={NationalDex.Ursaluna}
          formeNumber={BLOOD_MOON}
          key="ursaluna-bloodmoon"
          pokedex={pokedex}
          onClick={onClick}
        />
      )}
    </Flex>
  )
}

function EvolutionLine({ nationalDex, formeNumber, pokedex, onClick }: EvolutionFamilyProps) {
  const formeMetadata = MetadataLookup(nationalDex, formeNumber)
  const evolutions = formeMetadata?.evolutions ?? []
  const megaFormes = SpeciesLookup(nationalDex)?.formes.filter((f) => f.isMega) ?? []

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
            <Flex key={`${nationalDex}-${mega.formeIndex}`} align="center" gap="2">
              <ArrowLeftRightIcon
                style={{
                  rotate: `${((megaFormes.length - 1) / 2 - i) * -36}deg`,
                  marginTop: ((megaFormes.length - 1) / 2 - i) * 15,
                  marginBottom: ((megaFormes.length - 1) / 2 - i) * -15,
                }}
              />
              <TooltipPokemonIcon
                dexNumber={nationalDex}
                formeNumber={mega.formeIndex}
                silhouette={
                  !getFormeStatus(pokedex, nationalDex, mega.formeIndex)?.includes('Caught')
                }
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
