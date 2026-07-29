import { nullIfNone, nullIfNoneInt } from '@openhome-core/util'
import { CssRemSize } from '@openhome-ui/util/style'
import { Checkbox, Select, Switch, TextArea, TextField, type SwitchProps } from '@radix-ui/themes'
import { type CSSProperties, type ReactNode } from 'react'
import type { TypeaheadProps } from '../typeahead/Typeahead'
import Typeahead from '../typeahead/Typeahead'
// import DateInput, { type DateInputProps } from './DateInput'
import './style.css'

interface LabelledInputProps {
  label?: string
  placeholder?: string
  flex?: number
  colSpan?: [number, number]
  style?: CSSProperties
  fill?: boolean
  labelWidth?: CssRemSize
  labelInputGap?: CssRemSize
  minInputWidth?: CssRemSize
  error?: string
  disabled?: boolean
}

function gridColumnsCss(span?: [number, number]): string | undefined {
  if (!span) return undefined
  return `${span[0]} / ${span[1]}`
}

function labelClass(props: { fill?: boolean; disabled?: boolean }) {
  return (
    'labelled-input' +
    (props.fill ? ' labelled-input-fill' : '') +
    (props.disabled ? ' labelled-input-disabled' : '')
  )
}

function styleFromProps(props: LabelledInputProps): CSSProperties {
  return {
    '--label-width': props.labelWidth,
    '--min-input-width': props.minInputWidth,
    '--label-input-gap': !props.label ? 0 : props.labelInputGap,
    flex: props.flex,
    gridColumn: gridColumnsCss(props.colSpan),
    ...props.style,
  } as CSSProperties
}

type LabelledTextInputProps = {
  value: string | null
  onChange: (newValue: string | null) => void
} & LabelledInputProps &
  Omit<TextField.RootProps, 'value' | 'onChange'>

function formatLabel(props: { label?: string; required?: boolean }, noColon?: boolean) {
  if (!props.label) return ''
  return `${props.label}${props.required ? '*' : ''}${!noColon ? ':' : ''}`
}

function LabelledTextInput(props: LabelledTextInputProps) {
  const { value, error, onChange, style, ...textFieldProps } = props

  const styleVars = styleFromProps(props)

  return (
    <label className={labelClass(props)} style={{ ...styleVars, ...style }}>
      {formatLabel(props)}
      <div>
        <TextField.Root
          size="1"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          {...textFieldProps}
        />
        {error && <aside className="form-error">{error}</aside>}
      </div>
    </label>
  )
}

function LabelledTextAreaInput(props: LabelledTextInputProps) {
  const { value, onChange, placeholder } = props

  return (
    <label className={labelClass(props)} style={styleFromProps(props)}>
      {formatLabel(props)}
      <TextArea
        size="1"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value ?? null)}
      />
    </label>
  )
}

type LabelledTypeaheadInputProps<T> = TypeaheadProps<T> & LabelledInputProps & { label: string }

function LabelledTypeaheadInput<T>(props: LabelledTypeaheadInputProps<T>) {
  return (
    <label className={labelClass(props)} style={styleFromProps(props)}>
      {formatLabel(props)}
      <Typeahead {...props} />
    </label>
  )
}

type LabelledIntInputProps = {
  value: number | null
  onChange: (newValue: number | null) => void
} & LabelledInputProps

function LabelledIntInput(props: LabelledIntInputProps) {
  const { value, onChange, placeholder, ...inputProps } = props

  return (
    <label className={labelClass(props)} style={styleFromProps(props)}>
      {formatLabel(props)}
      <TextField.Root
        size="1"
        placeholder={placeholder}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseIntOrNull(e.target.value))}
        {...inputProps}
      />
    </label>
  )
}

// type LabelledDateInputProps = DateInputProps & LabelledInputProps

// function LabelledDateInput(props: LabelledDateInputProps) {
//   const { error, ...dateInputProps } = props

//   return (
//     <label className={labelClass(props)} style={styleFromProps(props)}>
//       {formatLabel(props)}
//       <div>
//         <DateInput key={dateInputProps.value} size="1" {...dateInputProps} />
//         {error && <aside className="form-error">{error}</aside>}
//       </div>
//     </label>
//   )
// }

type LabelledSelectProps = {
  children: ReactNode
} & LabelledInputProps &
  Select.RootProps

function LabelledSelect(props: LabelledSelectProps) {
  const { children, ...selectProps } = props

  return (
    <label className={labelClass(props)} style={styleFromProps(props)}>
      {formatLabel(props)}
      <Select.Root size="1" {...selectProps}>
        <Select.Trigger />
        <Select.Content side="bottom">{children}</Select.Content>
      </Select.Root>
    </label>
  )
}

type LabelledSelectNullableProps = {
  children: ReactNode
} & LabelledInputProps &
  Omit<Select.RootProps, 'onValueChange' | 'value'> &
  (
    | { valueType?: 'string'; value?: string | null; onValueChange: (value: string | null) => void }
    | { valueType: 'number'; value?: number | null; onValueChange: (value: number | null) => void }
  )

function LabelledSelectNullable(props: LabelledSelectNullableProps) {
  const { children, ...selectProps } = props

  return (
    <label className={labelClass(props)} style={styleFromProps(props)}>
      {formatLabel(props)}
      <Select.Root
        size="1"
        {...selectProps}
        value={props.value?.toString() || 'none'}
        onValueChange={(value) =>
          props.valueType === 'number'
            ? props.onValueChange(nullIfNoneInt(value))
            : props.onValueChange(nullIfNone(value))
        }
      >
        <Select.Trigger
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault()
              props.onValueChange(null)
            }
          }}
        />
        <Select.Content side="bottom">
          <Select.Item key="none" value="none" />
          {children}
        </Select.Content>
      </Select.Root>
    </label>
  )
}

type LabelledSwitchProps = LabelledInputProps & SwitchProps

function LabelledSwitch(props: LabelledSwitchProps) {
  return (
    <label className="switch-label" style={styleFromProps(props)}>
      {formatLabel(props)}
      <Switch color="jade" radius="full" {...props} />
    </label>
  )
}

type LabelledCheckboxProps = LabelledInputProps & SwitchProps

function LabelledCheckbox(props: LabelledCheckboxProps) {
  return (
    <label className="checkbox-label" style={styleFromProps(props)}>
      <Checkbox color="jade" radius="full" {...props} />
      {formatLabel(props, true)}
    </label>
  )
}

const LabelledInput = {
  Text: LabelledTextInput,
  TextArea: LabelledTextAreaInput,
  Typeahead: LabelledTypeaheadInput,
  Int: LabelledIntInput,
  // Date: LabelledDateInput,
  Select: LabelledSelect,
  SelectNullable: LabelledSelectNullable,
  Switch: LabelledSwitch,
  Checkbox: LabelledCheckbox,
}

export default LabelledInput

function parseIntOrNull(input: string) {
  const parsed = parseInt(input)
  return isNaN(parsed) ? null : parsed
}
