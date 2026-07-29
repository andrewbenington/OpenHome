import LabelledInput from '../input/LabelledInput'
import './style.css'
import { PokemonFormController } from './usePokemonSearch'

interface PokemonFormProps {
  controller: PokemonFormController
}

export function InjuryForm(props: PokemonFormProps) {
  const { controller } = props
  return (
    <div className="form-vertical" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <LabelledInput.Text
        label="Name"
        value={controller.name}
        onChange={(value) => controller.setName(value ?? '')}
        colSpan={[1, 3]}
      />
    </div>
  )
}
