import { Flex, Select, Switch } from '@radix-ui/themes'
import { TopRightIndicatorType, useMonDisplay } from '../../../state/mon-display/useMonDisplay'

export default function DisplayPanel() {
  const displayState = useMonDisplay()

  return (
    <div style={{ contain: 'none', padding: 4 }}>
      <Flex direction="column" m="1" gap="1">
        <Select.Root
          value={displayState.topRightIndicator ?? ''}
          onValueChange={(value) =>
            displayState.setTopRightIndicatorType(
              value === 'None' ? null : (value as TopRightIndicatorType)
            )
          }
          size="1"
        >
          <Select.Trigger placeholder="Top-Right Indicator" />
          <Select.Content position="popper">
            <Select.Item value="None">None</Select.Item>
            {TopRightIndicatorTypes.map((indicatorType) => (
              <Select.Item key={indicatorType} value={indicatorType}>
                {indicatorType}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Flex align="center" gap="2">
          <Switch
            size="1"
            checked={displayState.showShiny}
            onCheckedChange={displayState.setShowShiny}
          />
          Shiny Icons
        </Flex>
        <Flex align="center" gap="2">
          <Switch
            size="1"
            checked={displayState.showItem}
            onCheckedChange={displayState.setShowItem}
          />
          Show Items
        </Flex>
      </Flex>
    </div>
  )
}

const TopRightIndicatorTypes: TopRightIndicatorType[] = [
  'Gender',
  'Origin Game',
  'EVs (Total)',
  'EV (HP)',
  'EV (Attack)',
  'EV (Defense)',
  'EV (Special Attack)',
  'EV (Special Defense)',
  'EV (Speed)',
  'IVs (Percent)',
]
