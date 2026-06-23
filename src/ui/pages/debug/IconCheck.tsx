import { range } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SideTabNavigation from '@openhome-ui/components/side-tabs/SideTabNavigation'
import { useSpeciesData } from '@openhome-ui/hooks/pkm_rs'
import { extraFormDisplayName, extraFormsByNationalDex, extraFormSpriteName } from '@pkm-rs/pkg'
import { Generation } from '@pkm-rs/pkg/pkm_rs'
import { Flex, ScrollArea, Separator, Switch, Tooltip } from '@radix-ui/themes'
import { useState } from 'react'
import './IconCheck.css'

export default function IconCheck() {
  const [showShiny, setShowShiny] = useState(false)
  return (
    <SideTabNavigation
      defaultTab="gen1"
      parentPathSegment="debug/pokemon"
      routes={range(1, 10).map((gen) => ({
        display: `Generation ${gen}`,
        route: `gen${gen}`,
        component: <GenerationIcons gen={gen} shiny={showShiny} />,
      }))}
    >
      <Flex className="original-data-switch" align="center" gap="2">
        <Switch radius="full" size="1" checked={showShiny} onCheckedChange={setShowShiny} />
        Shiny
      </Flex>
    </SideTabNavigation>
  )
}

function GenerationIcons(props: { gen: Generation; shiny?: boolean }) {
  const generationSpecies = useSpeciesData().filter(
    (species) => species.forms[0].introducedGen === props.gen
  )
  return (
    <div className="generation-icons">
      <ScrollArea className="scroll-area" size="2" scrollbars="vertical" radius="full">
        {generationSpecies.map((s) => (
          <div key={s.nationalDex} className="icon-check-row">
            <Flex align="center" gap="0.25rem">
              <div className="species-display">
                {s.forms[0].formeName}
                <PokemonIcon
                  dexNumber={s.nationalDex}
                  formIndex={0}
                  isShiny={props.shiny}
                  style={{ width: '2rem', height: '2rem' }}
                />
              </div>
              <div className="form-flex-outer">
                <div className="form-flex">
                  {s.forms.length > 1 && <Separator orientation="vertical" />}
                  {s.forms.slice(1).map((f) => (
                    <Tooltip
                      key={f.formIndex}
                      content={`${f.formIndex} - ${f.formeName} (${f.sprite})`}
                    >
                      <PokemonIcon
                        dexNumber={s.nationalDex}
                        formIndex={f.formIndex}
                        isShiny={props.shiny}
                        style={{ width: '2rem', height: '2rem' }}
                      />
                    </Tooltip>
                  ))}
                </div>
                <div className="form-flex">
                  {extraFormsByNationalDex(s.nationalDex).length > 0 && (
                    <Separator orientation="vertical" />
                  )}
                  {extraFormsByNationalDex(s.nationalDex).map((e) => (
                    <Tooltip
                      key={e}
                      content={`${e} - ${extraFormDisplayName(e)} (${extraFormSpriteName(e)})`}
                    >
                      <PokemonIcon
                        dexNumber={s.nationalDex}
                        extraFormIndex={e}
                        style={{ width: '2rem', height: '2rem' }}
                      />
                    </Tooltip>
                  ))}
                </div>
              </div>
            </Flex>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
