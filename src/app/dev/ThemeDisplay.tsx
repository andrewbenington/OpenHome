import { Button, Palette, Typography, useTheme } from '@mui/joy'
import { ColorPaletteProp, PalettePrimary, VariantProp } from '@mui/joy/styles/types'
import { Card } from '@radix-ui/themes'

const colorPalettes = ['primary', 'secondary', 'neutral']

function getVariant(s: string): VariantProp {
  if (s.startsWith('outlined')) return 'outlined'
  if (s.startsWith('soft')) return 'soft'
  if (s.startsWith('solid')) return 'solid'
  return 'plain'
}

export default function ThemeDisplay() {
  const theme = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 8,
      }}
    >
      {colorPalettes.map((colorName) => (
        <Card key={`buttons_${colorName}`}>
          <Typography fontWeight={'bold'}>{colorName}</Typography>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {Object.entries(theme.variants).map(([variantName]) => (
              <Button
                key={`button_${colorName}_${variantName}`}
                variant={variantName as VariantProp}
                color={colorName as ColorPaletteProp}
                aria-pressed={variantName.endsWith('Active')}
                disabled={variantName.endsWith('Disabled')}
                style={{
                  color:
                    getVariant(variantName) !== variantName
                      ? (theme.palette[colorName as keyof Palette] as PalettePrimary)[
                          `${variantName}Color` as keyof PalettePrimary
                        ]
                      : undefined,
                }}
              >
                {variantName}
              </Button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
