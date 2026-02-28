import { Card } from '@radix-ui/themes'
import { useBanksAndBoxes } from '../state-zustand/banks-and-boxes/store'

export default function ZustandTest() {
  const { banks } = useBanksAndBoxes()

  return (
    <div>
      {banks.map((bank) => (
        <Card key={bank.id} style={{ backgroundColor: 'fuchsia' }}>
          {bank.name}
          {bank.boxes.map((b) => b.name)}
        </Card>
      ))}
    </div>
  )
}
