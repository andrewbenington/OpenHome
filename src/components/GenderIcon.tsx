import { Gender } from '@pkm-rs/pkg'
import { displayGender, genderSymbol } from 'src/types/types'
import './components.css'

interface GenderIconProps {
  gender?: Gender
  size?: number
}

export default function GenderIcon({ gender, size }: GenderIconProps) {
  return (
    gender !== undefined &&
    gender < Gender.Genderless && (
      <div
        className="gender-icon"
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
