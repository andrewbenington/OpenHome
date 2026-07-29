// export type DateInputProps = {
//   value?: DateString | null
//   onChange?: (v: DateString | null) => void
// } & Omit<TextField.RootProps, 'value' | 'onChange'>

// export default function DateInput(props: DateInputProps) {
//   const { value, onChange, ...textFieldProps } = props
//   const [dateText, setDateText] = useState<string>(value ?? '')

//   return (
//     <TextField.Root
//       size="1"
//       type="date"
//       value={dateText ?? ''}
//       onBlur={(e) => {
//         if (!e.target.valueAsDate) {
//           onChange?.(null)
//         } else {
//           // MUST use UTC here. valueAsDate seems to be always be in UTC, so an entry of 12/1/2025 will be 11/30/2025 in Chicago time unless we treat it as UTC.
//           const dateValue = dayjs.utc(e.target.valueAsDate)
//           onChange?.(SimpleDate.fromDayjs(dateValue).toDateString())
//         }
//       }}
//       onChange={(e) => setDateText(e.target.value)}
//       {...textFieldProps}
//     />
//   )
// }
