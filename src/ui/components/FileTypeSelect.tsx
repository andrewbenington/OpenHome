import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { monSupportedBySaveType } from '@openhome-core/save/util'
import { unique } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { useContext, useMemo } from 'react'

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
  PA9: '#31CA56',
  OhpkmV1: 'fuschia',
}

interface FileTypeSelectProps {
  baseFormat: string
  currentFormat: string
  color?: string
  formData: PKMInterface
  onChange: (selectedFormat: string) => void
  disabled?: boolean
}

const FileTypeSelect = (props: FileTypeSelectProps) => {
  const { baseFormat, currentFormat, color, formData, onChange } = props
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)

  const supportedFormats = useMemo(() => {
    const supportedFormats = unique(
      getEnabledSaveTypes().map((saveType) =>
        monSupportedBySaveType(saveType, formData) ? saveType.pkmType.getFormat() : undefined
      )
    ).filter(filterUndefined)

    return supportedFormats
  }, [formData, getEnabledSaveTypes])

  return (
    <select
      className="file-type-chip"
      value={currentFormat}
      onChange={(e) => onChange(e.target.value)}
      style={{
        backgroundColor: color ?? fileTypeColors[currentFormat],
        backgroundImage: props.disabled ? 'none' : undefined,
      }}
      disabled={props.disabled}
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
