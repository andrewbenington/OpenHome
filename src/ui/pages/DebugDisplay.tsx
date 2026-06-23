import { Grid } from '@radix-ui/themes'
import MoveCard from '../components/pokemon/MoveCard'

export default function ComponentDebugDisplay() {
  return (
    <Grid columns="repeat(4, 1fr)" gap="1">
      <MoveCard move={3} movePP={8} maxPP={8} />
      <MoveCard move={412} movePP={8} maxPP={8} />
      <MoveCard move={413} movePP={8} maxPP={8} />
      <MoveCard move={414} movePP={8} maxPP={8} />
      <MoveCard move={800} movePP={8} maxPP={8} noPP />
      <MoveCard move={900} movePP={8} maxPP={8} noPP />
      <MoveCard move={919} movePP={8} maxPP={8} noPP />
      <MoveCard move={742} movePP={8} maxPP={8} noPP />
    </Grid>
  )
}
