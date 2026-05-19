import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { OriginGames } from '@pkm-rs/pkg'
import { Flex } from '@radix-ui/themes'

export default function TrainersDisplay(props: { mon: OHPKM }) {
  const { mon } = props

  return (
    <div className="pokemon-modal-content">
      <Flex direction="column" gap="var(--padding-radius-sm-lg)">
        {mon.handlers.map((handler) => (
          <div
            className="pokemon-modal-card"
            key={`${handler.id}~${handler.name}~${handler.gender}`}
          >
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
                  alt={`${handler.origin_plugin ?? OriginGames.gameName(handler.origin_game)} logo`}
                  src={
                    handler.origin_plugin
                      ? `logos/${handler.origin_plugin}.png`
                      : OriginGames.logoPath(handler.origin_game)
                  }
                  style={{ height: 32 }}
                />
              )}
            </Flex>
          </div>
        ))}
      </Flex>
    </div>
  )
}
