import {
  BW2_TRANSFER_RESTRICTIONS,
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  PT_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS,
  SWSH_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from 'src/consts/TransferRestrictions'
import { PKMFormData } from 'src/types/PKMTypes'
import { isRestricted } from 'src/types/TransferRestrictions'
import { StringToStringMap, Styles } from 'src/types/types'

const styles = {
  fileTypeChip: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    boxShadow: 'none',
    '.MuiOutlinedInput-notchedOutline': { border: 0 },
    flex: 1,
    margin: 8,
  },
} as Styles

const fileTypeColors: StringToStringMap = {
  OHPKM: '#748fcd',
  PK1: '#b34',
  PK2: '#b6c',
  PK3: '#9b3',
  COLOPKM: '#93f',
  XDPKM: '#53b',
  PK4: '#f88',
  PK5: '#484',
  PK6: 'blue',
  PK7: 'orange',
  PB7: '#a75',
  PK8: '#6bf',
  PB8: '#6bf',
  PA8: '#8cc',
  PK9: '#f52',
}

interface FileTypeSelectProps {
  baseFormat: string
  currentFormat: string
  formData: PKMFormData
  onChange: (selectedFormat: string) => void
}

const FileTypeSelect = (props: FileTypeSelectProps) => {
  const { baseFormat, currentFormat, formData, onChange } = props
  console.log(baseFormat, currentFormat)
  return (
    <select
      value={currentFormat}
      onChange={(e) => {
        onChange(e.target.value)
      }}
      style={{
        ...styles.fileTypeChip,
        backgroundColor: fileTypeColors[currentFormat],
      }}
    >
      <option value="OHPKM">OpenHome</option>
      {baseFormat !== 'OHPKM' ? <option value={baseFormat}>{baseFormat}</option> : <div />}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN1_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK1">PK1</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN2_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK2">PK2</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK3">PK3</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="COLOPKM">COLOPKM</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="XDPKM">XDPKM</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(HGSS_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK4">PK4</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(BW2_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK5">PK5</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(ORAS_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK6">PK6</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(USUM_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK7">PK7</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(LGPE_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PB7">PB7</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(SWSH_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK8">PK8</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(PT_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PB8">PB8</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(LA_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PA8">PA8</option>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(SV_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <option value="PK9">PK9</option>
        )}
    </select>
  )
}

export default FileTypeSelect
