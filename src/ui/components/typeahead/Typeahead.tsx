import { Box, IconButton, Portal, Spinner, TextField } from '@radix-ui/themes'
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ClearIcon, DropdownArrowIcon } from '../Icons'
import { filterOptions } from './filter'
import './style.css'
import { useTypeahead } from './useTypeahead'

export interface TypeaheadProps<Option> {
  value?: Option | null
  onChange?: (val?: Option) => void
  onTextChange?: (newText: string) => void
  uniqueFieldId: string
  options: readonly Option[]
  noneOption?: Option
  getOptionString: (opt: Option) => string
  renderOption?: (opt: Option) => string | ReactNode
  getOptionUniqueID: (opt: Option) => string
  getIconComponent?: (selected: Option) => ReactNode | undefined
  onBlur?: () => void
  clearOnSelect?: boolean
  placeholder?: string
  loading?: boolean
  style?: CSSProperties
  nextFocusRef?: React.RefObject<HTMLElement | null>
}

export default function Typeahead<Option>(props: TypeaheadProps<Option>) {
  const {
    value: propValue,
    onChange,
    onTextChange,
    uniqueFieldId,
    options,
    noneOption,
    getOptionString,
    getOptionUniqueID,
    getIconComponent,
    renderOption,
    onBlur,
    clearOnSelect,
    placeholder,
    loading,
    style,
    nextFocusRef,
  } = props
  const inputElement = useRef<HTMLInputElement>(null)
  const outerElement = useRef<HTMLDivElement>(null)
  const isOptionEmpty = useCallback(
    (opt: Option) => {
      return noneOption && getOptionUniqueID(opt) === getOptionUniqueID(noneOption)
    },
    [getOptionUniqueID, noneOption]
  )
  const [state, dispatchState] = useTypeahead({
    expanded: false,
    options,
    uniqueFieldId: uniqueFieldId ?? '',
    getOptionString,
    highlightedIndex: null,
    inputFieldValue: propValue && !isOptionEmpty(propValue) ? getOptionString(propValue) : '',
  })
  const [inputRect, setInputRect] = useState<DOMRect | null>(null)

  const filteredOptions = useMemo(
    () =>
      state.inputFieldValue
        ? filterOptions(state.inputFieldValue, options, getOptionString)
        : options,
    [state.inputFieldValue, options, getOptionString]
  )

  useEffect(() => {
    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
    dispatchState(['set-options', options])
  }, [dispatchState, options])

  useEffect(() => {
    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
    if (propValue && !isOptionEmpty(propValue)) {
      // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
      dispatchState(['set-input', getOptionString(propValue)])
    } else if (!state.expanded) {
      // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
      dispatchState(['set-input', ''])
    }
  }, [
    dispatchState,
    getOptionString,
    isOptionEmpty,
    propValue,
    state.expanded,
    state.highlightedOption,
    state.inputFieldValue,
  ])

  const listboxWidth = outerElement.current?.clientWidth

  const hideDropdown = useCallback(() => {
    dispatchState('hide-dropdown')
    inputElement.current?.blur()
  }, [inputElement, dispatchState])

  const selectCurrent = useCallback(() => {
    if (state.highlightedOption) {
      if (clearOnSelect) {
        dispatchState(['set-input', ''])
      } else {
        dispatchState(['set-input', getOptionString(state.highlightedOption)])
      }

      onChange?.(state.highlightedOption)
      inputElement.current?.blur()
    } else {
      dispatchState(['set-input', ''])
    }

    dispatchState('hide-dropdown')
  }, [clearOnSelect, dispatchState, getOptionString, onChange, state.highlightedOption])

  useLayoutEffect(() => {
    if (state.expanded && outerElement.current) {
      const r = outerElement.current.getBoundingClientRect()
      setInputRect(r)
    }
  }, [state.expanded])

  useLayoutEffect(() => {
    function update() {
      if (outerElement.current) {
        setInputRect(outerElement.current.getBoundingClientRect())
      }
    }

    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div ref={outerElement} style={style}>
      <Box style={{ position: 'relative', textAlign: 'start' }}>
        <TextField.Root
          ref={inputElement}
          className="autocomplete"
          type="text"
          placeholder={placeholder ?? (noneOption ? 'None' : undefined)}
          size="1"
          value={state.inputFieldValue ?? null}
          onChange={(e) => {
            const selectedID = e.target.id.slice(7)
            const selectedOption = options.find((opt) => getOptionUniqueID(opt) === selectedID)

            dispatchState(['set-input', e.target.value])
            onChange?.(selectedOption)
            onTextChange?.(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
              selectCurrent()
              if (e.key === 'Tab' && nextFocusRef?.current) {
                e.preventDefault()
                nextFocusRef.current.focus()
              }
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
            onBlur?.()
          }}
        >
          {propValue && getIconComponent && (
            <TextField.Slot
              side="left"
              style={{ marginRight: 0, padding: '0px 0.25rem 0px 0.5rem' }}
            >
              {propValue && getIconComponent?.(propValue)}
            </TextField.Slot>
          )}
          {loading ? (
            <Spinner />
          ) : (
            state.inputFieldValue && (
              <TextField.Slot pr="1" side="right">
                <IconButton
                  color="gray"
                  variant="ghost"
                  onClick={() => {
                    dispatchState(['set-input', ''])
                    onChange?.(undefined)
                  }}
                  style={{ marginRight: 0 }}
                >
                  <ClearIcon style={{ width: '1rem', height: '1rem' }} />
                </IconButton>
              </TextField.Slot>
            )
          )}
          {
            <TextField.Slot side="right">
              <IconButton
                color="gray"
                variant="ghost"
                onMouseDown={() => dispatchState('toggle-dropdown')}
                style={{ marginRight: '0' }}
              >
                <DropdownArrowIcon
                  style={{
                    rotate: state.expanded ? '180deg' : undefined,
                    width: '1rem',
                    height: '1rem',
                  }}
                />
              </IconButton>
            </TextField.Slot>
          }
        </TextField.Root>
        {state.expanded && inputRect && (
          <Portal
            container={
              document.getElementsByClassName('rt-BaseDialogOverlay')?.[0] ?? // if a dialog is open, render dropdown above it so it is not covered
              document.getElementById('app-container')
            }
          >
            <ul
              className="autocomplete-dropdown"
              style={{
                width: listboxWidth,
                visibility: state.expanded ? 'visible' : 'collapse',
                top: inputRect.bottom,
                left: inputRect.left,
              }}
            >
              {filteredOptions.map((option, index) => (
                <li
                  key={`autocomplete-option-${getOptionString(option)}`}
                  className={`autocomplete-option ${index === state.highlightedIndex ? 'autocomplete-option-selected' : ''}`}
                  id={`autocomplete-option-${uniqueFieldId}-${index}`}
                  tabIndex={-1}
                  onMouseEnter={() => dispatchState(['set-highlighted', index])}
                  onMouseDown={selectCurrent}
                  // autoFocus={index === state.highlightedIndex}
                >
                  {renderOption ? renderOption(option) : getOptionString(option)}
                </li>
              ))}
            </ul>
          </Portal>
        )}
      </Box>
    </div>
  )
}
