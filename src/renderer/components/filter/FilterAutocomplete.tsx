import { Autocomplete, AutocompleteProps } from '@mui/joy'
import { useContext, useMemo } from 'react'
import { FilterContext } from 'src/renderer/state/filter'
import './style.css'

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
    // getIconComponent,
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
      renderOption={
        props.renderOption ??
        ((props, option) => {
          return (
            <li {...props} key={indexField ? option[indexField] : option}>
              {attributes.getOptionLabel
                ? attributes.getOptionLabel(option)
                : labelField
                ? option[labelField]
                : option}
            </li>
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
      // renderTags={
      //   renderInput ??
      //   ((params) => {
      //     if (getIconComponent && currentOption !== undefined) {
      //       const icon = getIconComponent(currentOption)
      //       params.InputProps.startAdornment = (
      //         <div
      //           style={{
      //             marginLeft: 4,
      //             marginRight: 0,
      //             display: 'grid',
      //             ...icon?.props.style,
      //           }}
      //         >
      //           {icon}
      //         </div>
      //       )
      //     }
      //     return (
      //       <TextField
      //         value={currentValue}
      //         color="secondary"
      //         {...params}
      //         label={label}
      //         sx={{ '& input': { transition: 'border-color 0.25s' }, color: 'green' }}
      //       />
      //     )
      //   })
      // }
      {...attributes}
    />
  )
}
