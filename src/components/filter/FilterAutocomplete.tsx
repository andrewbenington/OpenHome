import {
  Autocomplete,
  AutocompleteOption,
  AutocompleteProps,
  ListItemContent,
  ListItemDecorator,
} from '@mui/joy'
import { useContext, useMemo } from 'react'
import './style.css'
import { FilterContext } from 'src/state/filter'

export interface FilterAutocompleteProps<OptionType>
  extends Omit<AutocompleteProps<OptionType, false, false, false>, 'renderInput'> {
  options: readonly OptionType[]
  labelField?: string
  indexField?: string
  filterField: string
  label?: string
  getIconComponent?: (selected: OptionType) => JSX.Element | undefined
  renderInput?: ((params: any) => React.ReactNode) | undefined
}

export default function FilterAutocomplete<OptionType>(props: FilterAutocompleteProps<OptionType>) {
  const {
    options,
    labelField,
    indexField,
    filterField,
    // label,
    // renderInput,
    getIconComponent,
    ...attributes
  } = props
  const [filterState, dispatchFilterState] = useContext(FilterContext)

  const currentOption: OptionType | undefined = useMemo(() => {
    if (options.length === 0) return undefined
    if (typeof options[0] === 'string') {
      return filterState[filterField]
    }
    if (filterField in filterState && filterState[filterField] !== undefined) {
      return options.find((option) => option[indexField ?? 'id'] === filterState[filterField])
    }
    return undefined
  }, [filterField, filterState])

  // const currentValue: string | null = useMemo(() => {
  //   if (typeof currentOption === 'string') return currentOption
  //   if (!currentOption) return null
  //   return labelField ? currentOption[labelField] : JSON.stringify(currentOption)
  // }, [currentOption])

  return (
    <Autocomplete
      selectOnFocus
      clearOnBlur
      value={currentOption ?? null}
      isOptionEqualToValue={(option, value) => {
        if (typeof option === 'string') {
          return option === value
        }
        return option[filterField] === value[filterField]
      }}
      startDecorator={currentOption && getIconComponent && getIconComponent(currentOption)}
      renderOption={
        props.renderOption ??
        ((props, option) => {
          return (
            <AutocompleteOption {...props} key={indexField ? option[indexField] : option}>
              {getIconComponent && (
                <ListItemDecorator style={{ marginRight: -16 }}>
                  {getIconComponent(option)}
                </ListItemDecorator>
              )}
              <ListItemContent sx={{ fontSize: 'sm' }}>
                {attributes.getOptionLabel
                  ? attributes.getOptionLabel(option)
                  : labelField
                    ? option[labelField]
                    : option}
              </ListItemContent>
            </AutocompleteOption>
          )
        })
      }
      options={options}
      onChange={(_, newValue) => {
        if (!newValue) {
          dispatchFilterState({
            type: 'clear_fields',
            payload: [filterField],
          })
          return
        }
        dispatchFilterState({
          type: 'set_filter',
          payload: { [filterField]: indexField ? newValue[indexField] : newValue },
        })
      }}
      {...attributes}
    />
  )
}
