import { displayGender } from '@openhome-core/util/types'
import { BinaryGender, Gender } from '@pkm-rs/pkg'
import './style.css'

interface GenderIconProps {
  gender?: Gender | BinaryGender
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

function genderSymbol(gender: Gender | BinaryGender): string {
  switch (gender) {
    case Gender.Male:
    case BinaryGender.Male:
      return '♂'
    case Gender.Female:
    case BinaryGender.Female:
      return '♀'
    default:
      return ''
  }
}
