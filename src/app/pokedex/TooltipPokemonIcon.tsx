import { MetadataLookup } from '@pkm-rs-resources/pkg'
import { Tooltip } from '@radix-ui/themes'
import PokemonIcon, { PokemonIconProps } from 'src/components/PokemonIcon'

const ICON_SIZE = 32

export type TooltipPokemonIconProps = PokemonIconProps & {
  onClick?: (nationalDex: number, formeNumber: number) => void
}

export default function TooltipPokemonIcon(props: TooltipPokemonIconProps) {
  const { onClick, ...pkmIconProps } = props

  return (
    <Tooltip content={MetadataLookup(props.dexNumber, props.formeNumber ?? 0)?.formeName}>
      <PokemonIcon
        {...pkmIconProps}
        onClick={() => onClick?.(props.dexNumber, props.formeNumber ?? 0)}
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          cursor: onClick ? 'pointer' : undefined,
          ...props.style,
        }}
      />
    </Tooltip>
  )
}
