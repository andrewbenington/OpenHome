import { Box, IconButton, TextField } from '@radix-ui/themes'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './components.css'
import { DropdownArrowIcon, RemoveIcon } from './Icons'

type SLJAutocompleteProps<Option> = {
  field?: string
  value?: Option | null
  onChange?: (val?: Option) => void
  label?: string
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

export default function SLJAutocomplete<Option>(props: SLJAutocompleteProps<Option>) {
  const {
    field,
    value: propValue,
    onChange,
    label,
    options,
    getOptionString,
    getOptionUniqueID,
    getIconComponent,
  } = props
  const [value, setValue] = useState(propValue ? getOptionString(propValue) : '')
  const [highlightedOpt, setHighlightedOpt] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const inputElement = useRef<HTMLInputElement>(null)
  const outerElement = useRef<HTMLDivElement>(null)
  const [listboxWidth, setListboxWidth] = useState<number>()

  const filteredOptions = useMemo(
    () => (value ? filterOptions(value, options, getOptionString) : options),
    [value, options, getOptionString]
  )

  useEffect(() => {
    if (highlightedOpt === null && value) {
      if (filteredOptions.length) {
        setHighlightedOpt(0)
      }
    }
  }, [highlightedOpt, filteredOptions, value])

  useEffect(() => {
    if (propValue) {
      setValue(getOptionString(propValue))
    }
  }, [getOptionString, propValue])

  // console.log({ propValue, value, field })

  useEffect(() => {
    if (outerElement?.current) {
      if (outerElement.current.clientWidth !== listboxWidth)
        setListboxWidth(outerElement.current.clientWidth)
    }
  }, [outerElement.current?.clientWidth, listboxWidth])

  const hideDropdown = useCallback(() => {
    setHighlightedOpt(null)
    setFocused(false)
    inputElement.current?.blur()
  }, [inputElement])

  return (
    <div id={field ? `${field}-autocomplete` : undefined} ref={outerElement}>
      <Box style={{ position: 'relative', marginTop: 4 }}>
        <TextField.Root
          id={field}
          ref={inputElement}
          className="autocomplete"
          type="text"
          size="3"
          value={value ?? null}
          placeholder={label}
          // size={max([20, (value?.length ?? 0) + 5])}
          onChange={(e) => {
            const selectedID = e.target.id.slice(7)
            const selectedOption = options.find((opt) => getOptionUniqueID(opt) === selectedID)

            setValue(e.target.value)
            onChange?.(selectedOption)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (highlightedOpt !== null) {
                setValue(getOptionString(filteredOptions[highlightedOpt]))
                onChange?.(filteredOptions[highlightedOpt])
                setFocused(false)
                return
              }
            }
            if (e.key === 'Escape') {
              setHighlightedOpt(null)
              hideDropdown()
            }

            if (!focused) setFocused(true)
            if (e.key === 'ArrowDown') {
              if (highlightedOpt === null) {
                setHighlightedOpt(0)
              } else {
                setHighlightedOpt((highlightedOpt + 1) % filteredOptions.length)
              }
            } else if (e.key === 'ArrowUp') {
              if (highlightedOpt === 0) {
                setHighlightedOpt(null)
                e.preventDefault()
              } else if (highlightedOpt !== null) {
                setHighlightedOpt(
                  highlightedOpt - 1 < 0 ? filteredOptions.length - 1 : highlightedOpt - 1
                )
              }
            } else if (e.key === 'Tab' && !e.shiftKey) {
              if (highlightedOpt !== null) {
                onChange?.(filteredOptions[highlightedOpt])
                setValue(getOptionString(filteredOptions[highlightedOpt]))
              }
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!field || !e.relatedTarget?.id.startsWith(`${field}_suggestion_`)) {
              setTimeout(() => setFocused(false), 200)
            }
          }}
        >
          {propValue && getIconComponent && (
            <TextField.Slot side="left" style={{ marginRight: 0 }}>
              {propValue && getIconComponent?.(propValue)}
            </TextField.Slot>
          )}
          {value && (
            <TextField.Slot pr="1" side="right">
              <IconButton
                color="gray"
                variant="ghost"
                onClick={() => {
                  setValue('')
                  onChange?.(undefined)
                }}
              >
                <RemoveIcon />
              </IconButton>
            </TextField.Slot>
          )}
          <TextField.Slot side="right">
            <IconButton color="gray" variant="ghost" onClick={() => setFocused(!focused)}>
              <DropdownArrowIcon style={{ rotate: focused ? '180deg' : undefined }} />
            </IconButton>
          </TextField.Slot>
        </TextField.Root>

        <ul
          className="autocomplete-dropdown"
          id={`${field}-autoselect-options`}
          style={{ width: listboxWidth, visibility: focused ? 'visible' : 'collapse' }}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={`autocomplete-option-${index}`}
              className={`autocomplete-option ${index === highlightedOpt ? 'selected' : undefined}`}
              id={`option_${getOptionUniqueID(option)}`}
              tabIndex={-1}
              onClick={(e) => {
                setValue(getOptionString(option))
                onChange?.(option)
                setFocused(false)
                setHighlightedOpt(null)
                if (field) {
                  const outerID = `${field}-autocomplete`
                  const nextElement = document.getElementById(outerID)?.nextElementSibling
                  const nextElementInputs = nextElement?.getElementsByTagName('input')

                  if (nextElementInputs?.length) {
                    nextElementInputs[0].focus()
                  } else {
                    const nextElementSelects = nextElement?.getElementsByTagName('select')

                    if (nextElementSelects?.length) {
                      nextElementSelects[0]?.focus()
                    }
                  }
                }
                e.preventDefault()
              }}
              onMouseEnter={() => setHighlightedOpt(index)}
            >
              {getOptionString(option)}
            </li>
          ))}
        </ul>
      </Box>
    </div>
  )
}
