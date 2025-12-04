import { Box, IconButton, TextField } from '@radix-ui/themes'
import {
  Dispatch,
  ReactNode,
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import './components.css'
import { ClearIcon, DropdownArrowIcon } from './Icons'

type SLJAutocompleteProps<Option> = {
  value?: Option | null
  onChange?: (val?: Option) => void
  label: string
  options: Option[]
  getOptionString: (opt: Option) => string
  getOptionUniqueID: (opt: Option) => string
  getIconComponent?: (selected: Option) => ReactNode | undefined
}

// First list options that start with the input, then options containing a word
// that starts with the input
function filterOptions<Option>(
  input: string,
  options: Option[],
  optionToString: (opt: Option) => string
) {
  const startMatch: Option[] = []
  const wordMatch: Option[] = []
  const spaceInInput = input.includes(' ')
  const upperInput = input.toUpperCase()

  for (const opt of options) {
    const label = optionToString(opt)

    if (!label) continue
    if (label.toUpperCase().startsWith(upperInput)) {
      startMatch.push(opt)
    } else if (
      !spaceInInput &&
      label.split(' ').some((segment) => segment.toUpperCase().startsWith(upperInput))
    ) {
      wordMatch.push(opt)
    }
  }

  return startMatch.concat(wordMatch)
}

type AutocompleteState<Option> = {
  expanded: boolean
  options: Option[]
  label: string // manual scrolling doesn't work if this is the same as another autocorrect instance
  getOptionString: (opt: Option) => string
  highlightedIndex: number | null
  inputFieldValue: string
}

type AugmentedAutocompleteState<Option> = AutocompleteState<Option> & {
  filteredOptions: Option[]
  highlightedOption: Option | null
}

type AutocompleteAction =
  | 'hide-dropdown'
  | 'expand-dropdown'
  | 'toggle-dropdown'
  | 'highlight-down'
  | 'highlight-up'
  | ['set-highlighted', number | null]
  | ['set-input', string]

function useAutocomplete<Option>(
  initialState: AutocompleteState<Option>
): [AugmentedAutocompleteState<Option>, Dispatch<AutocompleteAction>] {
  const reducer: Reducer<AutocompleteState<Option>, AutocompleteAction> = (
    state: AutocompleteState<Option>,
    action: AutocompleteAction
  ) => {
    if (typeof action === 'string') {
      switch (action) {
        case 'expand-dropdown': {
          return { ...state, expanded: true, highlightedIndex: 0 }
        }
        case 'hide-dropdown': {
          return { ...state, expanded: false, highlightedIndex: null }
        }
        case 'toggle-dropdown': {
          return { ...state, expanded: !state.expanded }
        }
        case 'highlight-down': {
          const nextIndex =
            state.highlightedIndex === null
              ? 0
              : (state.highlightedIndex + 1) % state.options.length

          document
            .getElementById(`autocomplete-option-${state.label}-${nextIndex}`)
            ?.scrollIntoView({ block: 'center' })

          return {
            ...state,
            highlightedIndex: nextIndex,
          }
        }
        case 'highlight-up': {
          const prevIndex =
            state.highlightedIndex === null
              ? 0
              : state.highlightedIndex === 0
                ? state.options.length - 1
                : state.highlightedIndex - 1

          document
            .getElementById(`autocomplete-option-${state.label}-${prevIndex}`)
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
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)
  const filteredOptions = useMemo(
    () =>
      state.inputFieldValue
        ? filterOptions(state.inputFieldValue, state.options, state.getOptionString)
        : state.options,
    [state.inputFieldValue, state.options, state.getOptionString]
  )

  const highlightedOption = useMemo(() => {
    if (state.highlightedIndex === null || state.highlightedIndex >= filteredOptions.length) {
      return null
    }

    return filteredOptions[state.highlightedIndex]
  }, [filteredOptions, state.highlightedIndex])

  const augmentedState: AugmentedAutocompleteState<Option> = {
    ...state,
    filteredOptions,
    highlightedOption,
  }

  return [augmentedState, dispatch]
}

export default function SLJAutocomplete<Option>(props: SLJAutocompleteProps<Option>) {
  const {
    value: propValue,
    onChange,
    label,
    options,
    getOptionString,
    getOptionUniqueID,
    getIconComponent,
  } = props
  const inputElement = useRef<HTMLInputElement>(null)
  const outerElement = useRef<HTMLDivElement>(null)
  const [listboxWidth, setListboxWidth] = useState<number>()
  const [state, dispatchState] = useAutocomplete({
    expanded: false,
    options,
    label: label ?? '',
    getOptionString,
    highlightedIndex: null,
    inputFieldValue:
      propValue !== undefined && propValue !== null ? getOptionString(propValue) : '',
  })

  const filteredOptions = useMemo(
    () =>
      state.inputFieldValue
        ? filterOptions(state.inputFieldValue, options, getOptionString)
        : options,
    [state.inputFieldValue, options, getOptionString]
  )

  useEffect(() => {
    if (state.highlightedIndex === null && state.inputFieldValue && filteredOptions.length) {
      dispatchState(['set-highlighted', 0])
    }
  }, [filteredOptions, state.inputFieldValue, state.highlightedIndex, dispatchState])

  useEffect(() => {
    if (propValue !== undefined && propValue !== null) {
      dispatchState(['set-input', getOptionString(propValue)])
    } else if (state.inputFieldValue && !state.expanded) {
      // clear button
      dispatchState(['set-input', ''])
    }
  }, [dispatchState, getOptionString, propValue, state.expanded, state.inputFieldValue])

  useEffect(() => {
    if (outerElement?.current) {
      if (outerElement.current.clientWidth !== listboxWidth)
        setListboxWidth(outerElement.current.clientWidth)
    }
  }, [outerElement.current?.clientWidth, listboxWidth])

  const hideDropdown = useCallback(() => {
    dispatchState('hide-dropdown')
    inputElement.current?.blur()
  }, [inputElement, dispatchState])

  const selectCurrent = useCallback(() => {
    if (state.highlightedOption) {
      dispatchState(['set-input', getOptionString(state.highlightedOption)])
      onChange?.(state.highlightedOption)
      inputElement.current?.blur()
    } else {
      dispatchState(['set-input', ''])
    }
    dispatchState('hide-dropdown')
  }, [dispatchState, getOptionString, onChange, state.highlightedOption])

  return (
    <div ref={outerElement}>
      <Box style={{ position: 'relative', marginTop: 4 }}>
        <TextField.Root
          ref={inputElement}
          className="autocomplete"
          type="text"
          size="3"
          value={state.inputFieldValue ?? null}
          placeholder={label}
          onChange={(e) => {
            const selectedID = e.target.id.slice(7)
            const selectedOption = options.find((opt) => getOptionUniqueID(opt) === selectedID)

            dispatchState(['set-input', e.target.value])
            onChange?.(selectedOption)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
              selectCurrent()
              return
            }
            if (e.key === 'Escape') {
              hideDropdown()
              return
            }

            if (!state.expanded) dispatchState('expand-dropdown')
            if (e.key === 'ArrowDown') {
              dispatchState('highlight-down')
            } else if (e.key === 'ArrowUp') {
              dispatchState('highlight-up')
            }
          }}
          onFocus={() => dispatchState('expand-dropdown')}
          onBlur={(e) => {
            if (e.relatedTarget?.id.startsWith('autocomplete-option-')) {
              // if option is clicked (onClick doesn't work on dropdown options because they hide immediately)
              selectCurrent()
            } else if (!propValue) {
              dispatchState(['set-input', ''])
            }
            hideDropdown()
          }}
        >
          {propValue && getIconComponent && (
            <TextField.Slot side="left" style={{ marginRight: 0, padding: '0px 4px 0px 8px' }}>
              {propValue !== undefined && propValue !== null && getIconComponent?.(propValue)}
            </TextField.Slot>
          )}
          {state.inputFieldValue && (
            <TextField.Slot pr="1" side="right">
              <IconButton
                color="gray"
                variant="ghost"
                onClick={() => {
                  dispatchState(['set-input', ''])
                  onChange?.(undefined)
                }}
              >
                <ClearIcon />
              </IconButton>
            </TextField.Slot>
          )}
          <TextField.Slot side="right">
            <IconButton
              color="gray"
              variant="ghost"
              onMouseDown={() => dispatchState('toggle-dropdown')}
            >
              <DropdownArrowIcon style={{ rotate: state.expanded ? '180deg' : undefined }} />
            </IconButton>
          </TextField.Slot>
        </TextField.Root>

        <ul
          className="autocomplete-dropdown"
          style={{
            width: listboxWidth,
            visibility: state.expanded ? 'visible' : 'collapse',
          }}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={`autocomplete-option-${index}`}
              className={`autocomplete-option ${index === state.highlightedIndex ? 'selected' : undefined}`}
              id={`autocomplete-option-${label}-${index}`}
              tabIndex={-1}
              onMouseEnter={() => dispatchState(['set-highlighted', index])}
              autoFocus={index === state.highlightedIndex}
            >
              {getOptionString(option)}
            </li>
          ))}
        </ul>
      </Box>
    </div>
  )
}
