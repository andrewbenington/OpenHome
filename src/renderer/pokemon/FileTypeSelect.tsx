import { MenuItem, Select } from '@mui/material'
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
    border: 0,
    margin: 1,
    boxShadow: 'none',
    '.MuiOutlinedInput-notchedOutline': { border: 0 },
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
  return (
    <Select
      value={currentFormat}
      onChange={(e) => {
        onChange(e.target.value)
      }}
      sx={{
        ...styles.fileTypeChip,
        backgroundColor: fileTypeColors[currentFormat],
      }}
    >
      <MenuItem value="OHPKM">OpenHome</MenuItem>
      {baseFormat !== 'OHPKM' ? <MenuItem value={baseFormat}>{baseFormat}</MenuItem> : <div />}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN1_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK1">PK1</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN2_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK2">PK2</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK3">PK3</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="COLOPKM">COLOPKM</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="XDPKM">XDPKM</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(HGSS_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK4">PK4</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(BW2_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK5">PK5</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(ORAS_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK6">PK6</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(USUM_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK7">PK7</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(LGPE_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PB7">PB7</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(SWSH_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK8">PK8</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(PT_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PB8">PB8</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(LA_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PA8">PA8</MenuItem>
        )}
      {baseFormat === 'OHPKM' &&
        !isRestricted(SV_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formNum) && (
          <MenuItem value="PK9">PK9</MenuItem>
        )}
    </Select>
  )
}

export default FileTypeSelect
