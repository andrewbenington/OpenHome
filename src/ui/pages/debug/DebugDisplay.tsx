import SideTabNavigation from '@openhome-ui/components/side-tabs/SideTabNavigation'
import { Grid } from '@radix-ui/themes'
import MoveCard from '../../components/pokemon/MoveCard'
import IconCheck from './IconCheck'

export default function DebugDisplay() {
  return (
    <SideTabNavigation
      defaultTab="pokemon-display"
      parentPathSegment="debug"
      routes={[
        {
          route: 'pokemon',
          display: 'Pokémon Display',
          component: <IconCheck />,
        },
        {
          route: 'move-cards',
          display: 'Move Cards',
          component: (
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
          ),
        },
      ]}
    />
  )
}
