import { ConvertStrategyEntries, NamedStrategy } from '@openhome-core/tauri/spectaCommands'
import { Errorable, R } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { ConvertStrategy, getDefaultConvertStrategy } from '@pkm-rs/pkg'
import { createContext, useContext } from 'react'
import { ConvertStrategies } from './ConvertStrategiesProvider'

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

export type ConvertStrategiesController = {
  convertStrategies: ConvertStrategies
  updateConvertStrategies: (action: ConvertStrategyEntries) => Promise<Errorable<null>>
  defaultConvertStrategy: ConvertStrategy
  updateDefaultConvertStrategy: (updatedStrategy: Partial<ConvertStrategy>) => Promise<void>
}

export function useConvertStrategies(): ConvertStrategiesController {
  const [convertStrategies, updateConvertStrategies] = useContext(ConversionSettingsContext)
  const defaultConvertStrategy =
    convertStrategies.strategies_by_id[convertStrategies.default_strategy_id]?.strategy ??
    getDefaultConvertStrategy()

  async function updateDefaultConvertStrategy(updatedStrategy: Partial<ConvertStrategy>) {
    const currentDefault = convertStrategies.strategies_by_id[convertStrategies.default_strategy_id]
    const newDefault: NamedStrategy = {
      name: currentDefault?.name ?? 'Default',
      strategy: {
        ...(currentDefault?.strategy ?? getDefaultConvertStrategy()),
        ...updatedStrategy,
      },
    }
    await updateConvertStrategies({
      ...convertStrategies,
      ids_and_strategies: Object.entries({
        ...convertStrategies.strategies_by_id,
        [convertStrategies.default_strategy_id]: newDefault,
      })
        .map(([k, v]) => (v === undefined ? undefined : ([k, v] as [string, NamedStrategy])))
        .filter(filterUndefined),
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
  [ConvertStrategies, (action: ConvertStrategyEntries) => Promise<Errorable<null>>]
>([
  {
    strategies_by_id: {},
    default_strategy_id: ZERO_UUID,
  },
  async () => R.Err('Uninitialized'),
])

export type ConvertStrategyKey = keyof ConvertStrategy
