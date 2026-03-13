type SettingType = 'string' | 'number' | 'boolean' | 'array' | 'object'

interface SettingDescriptor<T> {
  display: string
  type: SettingType
  default: T
  description: string
  enum?: T[] // allowed values
  minimum?: number // for numbers
  maximum?: number
  deprecated?: string // deprecation message
}

type SettingsCategory = 'nickname'
export type SettingsSubcategory = `${SettingsCategory}.${string}`

export function displaySettingsCategory(category: SettingsCategory): string {
  switch (category) {
    case 'nickname':
      return 'Nicknames'
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
    enum: ['gameDefault', 'modern'],
    description:
      'Decides how unnicknamed Pokémon are capitalized when converted. "gameDefault" uses the capitalization from the original game, while "modern" capitalizes all nicknames in the modern style.',
    display: 'Capitalization',
  } as const,
} satisfies Record<SettingsSubcategory, SettingDescriptor<unknown>>

type Schema = typeof SETTINGS_SCHEMA
type SettingValue<T extends SettingDescriptor<unknown>> = T extends { enum: ReadonlyArray<infer U> }
  ? U
  : T['default']

export type FullConversionStrategy = {
  [K in keyof Schema]: SettingValue<Schema[K]>
}

export type ConversionStrategy = Partial<FullConversionStrategy>

export const DefaultConversionStrategy: FullConversionStrategy = {
  'nickname.capitalization': SETTINGS_SCHEMA['nickname.capitalization'].default,
}
