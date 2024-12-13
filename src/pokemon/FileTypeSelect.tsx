import { uniq } from 'lodash'
import { useContext, useMemo } from 'react'
import {
  BDSP_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS,
  SWSH_TRANSFER_RESTRICTIONS,
} from 'src/consts/TransferRestrictions'
import { supportsMon } from 'src/types/SAVTypes/util'
import { isRestricted } from 'src/types/TransferRestrictions'
import { PKMFormData, Styles } from 'src/types/types'
import { filterUndefined } from 'src/util/Sort'
import { AppInfoContext } from '../state/appInfo'

const styles = {
  fileTypeChip: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    boxShadow: 'none',
    flex: 1,
    margin: 8,
  },
} as Styles

const fileTypeColors: Record<string, string> = {
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
  color?: string
  formData: PKMFormData
  onChange: (selectedFormat: string) => void
}

const FileTypeSelect = (props: FileTypeSelectProps) => {
  const { baseFormat, currentFormat, color, formData, onChange } = props
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)

  const supportedFormats = useMemo(() => {
    const supportedFormats = uniq(
      getEnabledSaveTypes().map((saveType) =>
        supportsMon(saveType, formData.dexNum, formData.formeNum)
          ? saveType.pkmType.getName()
          : undefined
      )
    ).filter(filterUndefined)

    // These should be removed when support is added for their corresponding saves
    if (!isRestricted(LGPE_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formeNum)) {
      supportedFormats.push('PB7')
    }
    if (!isRestricted(SWSH_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formeNum)) {
      supportedFormats.push('PK8')
    }
    if (!isRestricted(BDSP_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formeNum)) {
      supportedFormats.push('PB8')
    }
    if (!isRestricted(LA_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formeNum)) {
      supportedFormats.push('PA8')
    }
    if (!isRestricted(SV_TRANSFER_RESTRICTIONS, formData.dexNum, formData.formeNum)) {
      supportedFormats.push('PK9')
    }
    return supportedFormats
  }, [formData])

  return (
    <select
      value={currentFormat}
      onChange={(e) => {
        onChange(e.target.value)
      }}
      style={{
        ...styles.fileTypeChip,
        backgroundColor: color ?? fileTypeColors[currentFormat],
      }}
    >
      <option value="OHPKM">OpenHome</option>
      {baseFormat === 'OHPKM' ? (
        supportedFormats.map((format) => (
          <option key={format} value={format}>
            {format}
          </option>
        ))
      ) : (
        <option value={baseFormat}>{baseFormat}</option>
      )}
    </select>
  )
}

export default FileTypeSelect
