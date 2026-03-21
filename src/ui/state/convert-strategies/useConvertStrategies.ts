import { Errorable, R } from '@openhome-core/util/functional'
import { ConvertStrategy, DefaultConversionStrategy } from '@pokemon-files/conversion/settings'
import { createContext, useContext } from 'react'
import { ConvertStrategies } from './ConvertStrategiesProvider'

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

export type ConvertStrategiesController = {
  convertStrategies: ConvertStrategies
  updateConvertStrategies: (updated: ConvertStrategies) => Promise<Errorable<null>>
  defaultConvertStrategy: ConvertStrategy
  updateDefaultConvertStrategy: (updatedStrategy: Partial<ConvertStrategy>) => Promise<void>
}

export function useConvertStrategies(): ConvertStrategiesController {
  const [convertStrategies, updateConvertStrategies] = useContext(ConversionSettingsContext)
  const defaultConvertStrategy =
    convertStrategies.strategies_by_id[convertStrategies.default_strategy_id].strategy

  async function updateDefaultConvertStrategy(updatedStrategy: Partial<ConvertStrategy>) {
    const currentDefault = convertStrategies.strategies_by_id[convertStrategies.default_strategy_id]
    const newDefault = {
      ...currentDefault,
      strategy: {
        ...currentDefault.strategy,
        ...updatedStrategy,
      },
    }
    await updateConvertStrategies({
      ...convertStrategies,
      strategies_by_id: {
        ...convertStrategies.strategies_by_id,
        [convertStrategies.default_strategy_id]: newDefault,
      },
    })
  }

  return {
    convertStrategies,
    updateConvertStrategies,
    defaultConvertStrategy,
    updateDefaultConvertStrategy,
  }
}

export const ConversionSettingsContext = createContext<
  [ConvertStrategies, (updated: ConvertStrategies) => Promise<Errorable<null>>]
>([
  {
    strategies_by_id: { [ZERO_UUID]: { name: 'Default', strategy: DefaultConversionStrategy } },
    default_strategy_id: ZERO_UUID,
  },
  async () => R.Err('Uninitialized'),
])
