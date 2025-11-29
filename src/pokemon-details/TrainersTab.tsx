import { OriginGames } from '@pkm-rs/pkg'
import { Card, Flex } from '@radix-ui/themes'
import { OHPKM } from 'src/types/pkm/OHPKM'

export default function TrainersDisplay(props: { mon: OHPKM }) {
  const { mon } = props

  return (
    <div style={{ padding: 8, height: 'calc(100% - 16px)' }}>
      <Flex direction="column">
        {mon.handlers.map((handler) => (
          <Card key={`${handler.id}~${handler.name}~${handler.gender}`} style={{ padding: 8 }}>
            <Flex align="center" gap="2">
              <Flex direction="column">
                <div>
                  <b>{handler.name}</b> {handler.gender ? '♀' : '♂'}{' '}
                  {handler.id ? `(${handler.id})` : ''}
                </div>
                Friendship: {handler.friendship} / 255
              </Flex>
              <div style={{ flex: 1 }} />
              {handler.origin_game && (
                <img
                  draggable={false}
                  alt={`${mon.pluginOrigin ?? OriginGames.gameName(handler.origin_game)} logo`}
                  src={OriginGames.logoPath(handler.origin_game)}
                  style={{ height: 32 }}
                />
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    </div>
  )
}
