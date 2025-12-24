import { displayGender } from '@openhome-core/util/types'
import { Gender } from '@pkm-rs/pkg'
import './style.css'

interface GenderIconProps {
  gender?: Gender
  size?: number
}

export default function GenderIcon({ gender, size }: GenderIconProps) {
  return (
    gender !== undefined &&
    gender < Gender.Genderless && (
      <div
        className="gender-icon badge-shadow"
        title={displayGender(gender)}
        style={{
          height: size ?? '1.1rem',
          width: size ?? '1.1rem',
          backgroundColor: gender === Gender.Male ? '#3377ff' : '#da5555',
        }}
      >
        <p>{genderSymbol(gender)}</p>
      </div>
    )
  )
}

function genderSymbol(gender: Gender): string {
  switch (gender) {
    case Gender.Male:
      return '♂'
    case Gender.Female:
      return '♀'
    default:
      return ''
  }
}
