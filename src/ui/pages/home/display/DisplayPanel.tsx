import { Flex, Select } from '@radix-ui/themes'
import { ExtraIndicatorType, useMonDisplay } from '../../../state/mon-display/useMonDisplay'

export default function DisplayPanel() {
  const { extraIndicator, setExtraIndicatorType } = useMonDisplay()

  return (
    <div style={{ contain: 'none', padding: 4 }}>
      <Flex direction="column" m="1" gap="0">
        <Select.Root
          value={extraIndicator}
          onValueChange={(value) => setExtraIndicatorType(value as ExtraIndicatorType)}
          size="1"
        >
          <Select.Trigger placeholder="Extra Indicator" />
          <Select.Content>
            {ExtraIndicatorTypes.map((indicatorType) => (
              <Select.Item key={indicatorType} value={indicatorType}>
                {indicatorType}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>
    </div>
  )
}

const ExtraIndicatorTypes: ExtraIndicatorType[] = [
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
