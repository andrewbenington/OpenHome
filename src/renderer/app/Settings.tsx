import { Card } from '@mui/joy'
import { useState } from 'react'

const romHackSaveTypes = ['PK3RR']

export default function Settings() {
  const [disabledSaveTypes, setDisabledSaveTypes] = useState<string[]>([])

  return (
    <div>
      <Card variant="outlined" sx={{ m: 1, maxWidth: 300 }}>
        <div>
          <b>Enabled ROM Hack Formats</b>
        </div>
        <ul>
          {romHackSaveTypes.map((format) => (
            <label style={{ display: 'flex', flexDirection: 'row' }}>
              <input
                type="checkbox"
                onChange={(e) =>
                  setDisabledSaveTypes(
                    e.target.checked
                      ? disabledSaveTypes?.filter((other) => other !== format)
                      : [...disabledSaveTypes, format]
                  )
                }
              />
              {format}
            </label>
          ))}
        </ul>
      </Card>
    </div>
  )
}
