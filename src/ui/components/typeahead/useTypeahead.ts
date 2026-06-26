import { useMemo, useReducer, type Dispatch, type Reducer } from 'react'
import { getFilteredOptions } from './filter'

interface TypeaheadState<Option> {
  expanded: boolean
  options: readonly Option[]
  uniqueFieldId: string // manual scrolling doesn't work if this is the same as another autocorrect instance
  getOptionString: (opt: Option) => string
  highlightedIndex: number | null
  inputFieldValue: string
}

type AugmentedTypeaheadState<Option> = TypeaheadState<Option> & {
  filteredOptions: readonly Option[]
  highlightedOption: Option | null
}

type AutocompleteAction<Option> =
  | 'hide-dropdown'
  | 'expand-dropdown'
  | 'toggle-dropdown'
  | 'highlight-down'
  | 'highlight-up'
  | ['set-highlighted', number | null]
  | ['set-input', string]
  | ['set-options', readonly Option[]]

export function useTypeahead<Option>(
  initialState: TypeaheadState<Option>
): [AugmentedTypeaheadState<Option>, Dispatch<AutocompleteAction<Option>>] {
  const reducer: Reducer<TypeaheadState<Option>, AutocompleteAction<Option>> = (
    state: TypeaheadState<Option>,
    action: AutocompleteAction<Option>
  ) => {
    const filteredOptions = getFilteredOptions(
      state.inputFieldValue,
      state.options,
      state.getOptionString
    )
    if (typeof action === 'string') {
      switch (action) {
        case 'expand-dropdown': {
          return { ...state, expanded: true, highlightedIndex: null }
        }
        case 'hide-dropdown': {
          return { ...state, expanded: false, highlightedIndex: null }
        }
        case 'toggle-dropdown': {
          return { ...state, expanded: !state.expanded }
        }
        case 'highlight-down': {
          if (state.highlightedIndex === null && state.inputFieldValue && filteredOptions.length) {
            return { ...state, highlightedIndex: 0 }
          }

          const nextIndex =
            state.highlightedIndex === null || state.options.length === 0
              ? 0
              : (state.highlightedIndex + 1) % state.options.length

          document
            .getElementById(`autocomplete-option-${state.uniqueFieldId}-${nextIndex}`)
            ?.scrollIntoView({ block: 'center' })

          return {
            ...state,
            highlightedIndex: nextIndex,
          }
        }
        case 'highlight-up': {
          if (state.highlightedIndex === null && state.inputFieldValue && filteredOptions.length) {
            return { ...state, highlightedIndex: 0 }
          }

          const prevIndex =
            state.highlightedIndex === null
              ? 0
              : state.highlightedIndex === 0
                ? state.options.length - 1
                : state.highlightedIndex - 1

          document
            .getElementById(`autocomplete-option-${state.uniqueFieldId}-${prevIndex}`)
            ?.scrollIntoView({ block: 'center' })

          return {
            ...state,
            highlightedIndex: prevIndex,
          }
        }
      }
    }

    const [actionType, payload] = action

    switch (actionType) {
      case 'set-highlighted': {
        return { ...state, highlightedIndex: payload }
      }
      case 'set-input': {
        return { ...state, inputFieldValue: payload }
      }
      case 'set-options': {
        return { ...state, options: payload }
      }
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)
  const filteredOptions = useMemo(
    () => getFilteredOptions(state.inputFieldValue, state.options, state.getOptionString),
    [state.inputFieldValue, state.options, state.getOptionString]
  )

  const highlightedOption = useMemo(() => {
    if (state.highlightedIndex === null || state.highlightedIndex >= filteredOptions.length) {
      return null
    }

    return filteredOptions[state.highlightedIndex]
  }, [filteredOptions, state.highlightedIndex])

  const augmentedState: AugmentedTypeaheadState<Option> = {
    ...state,
    filteredOptions,
    highlightedOption,
  }

  return [augmentedState, dispatch]
}
