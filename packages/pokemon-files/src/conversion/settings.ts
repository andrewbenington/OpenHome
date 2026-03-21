type SettingType = 'string' | 'number' | 'boolean' | 'array' | 'object'

type SettingDescriptor =
  | {
      display: string
      type: 'string'
      default: string
      description: string
      allowed_values?: string[]
      deprecated?: string
    }
  | {
      display: string
      type: 'boolean'
      default: boolean
      description: string
      maximum?: number
      deprecated?: string
    }
  | {
      display: string
      type: 'number'
      default: number
      description: string
      minimum?: number
      maximum?: number
      deprecated?: string
    }

type SettingsCategory = 'nickname' | 'metLocation'
export type SettingsSubcategory = `${SettingsCategory}.${string}`

export function displaySettingsCategory(category: SettingsCategory): string {
  switch (category) {
    case 'nickname':
      return 'Nicknames'
    case 'metLocation':
      return 'Met Location'
    default:
      return category
  }
}

export function getSettingsCategory(subcategory: SettingsSubcategory): SettingsCategory {
  const category = subcategory.split('.')[0]
  return category as SettingsCategory
}

export const SETTINGS_SCHEMA = {
  'nickname.capitalization': {
    type: 'string',
    default: 'gameDefault',
    allowed_values: ['gameDefault', 'modern'],
    description:
      'Decides how unnicknamed Pokémon are capitalized when converted. "gameDefault" uses the capitalization from the original game, while "modern" capitalizes all nicknames in the modern style.',
    display: 'Capitalization',
  } as const,
  'metLocation.useRegion': {
    type: 'boolean',
    default: true,
    description:
      'If true, the met location in-game will show the region name when possible. If false, it will show either "a faraway place" or "an in-game trade".',
    display: 'Use Region for Met Location (when possible)',
  } as const,
} satisfies Record<SettingsSubcategory, SettingDescriptor>

type Schema = typeof SETTINGS_SCHEMA
type SettingValue<T extends SettingDescriptor> = T extends {
  allowed_values: ReadonlyArray<infer U>
}
  ? U
  : T['default']

export type FullConversionStrategy = {
  [K in keyof Schema]: SettingValue<Schema[K]>
}

export type ConvertStrategy = Partial<FullConversionStrategy>

export const DefaultConversionStrategy: FullConversionStrategy = {
  'nickname.capitalization': SETTINGS_SCHEMA['nickname.capitalization'].default,
  'metLocation.useRegion': SETTINGS_SCHEMA['metLocation.useRegion'].default,
}
