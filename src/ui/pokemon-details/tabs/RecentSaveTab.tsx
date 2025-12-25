import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { OriginGames } from '@pkm-rs/pkg'
import { Card, Flex, Text } from '@radix-ui/themes'

export default function RecentSaveTab(props: { mon: OHPKM }) {
  const { mon } = props

  if (!mon.mostRecentSaveWasm) {
    return <div style={{ padding: 8 }}>No recent save data available.</div>
  }

  return (
    <Card style={{ padding: 8, margin: 8 }}>
      <Flex align="center" gap="2">
        <Flex direction="column">
          <div>
            <b>{mon.mostRecentSaveWasm.trainer_name}</b> ({mon.mostRecentSaveWasm.trainer_id})
          </div>
        </Flex>
        <div style={{ flex: 1 }} />

        <img
          draggable={false}
          alt={`${OriginGames.gameName(mon.mostRecentSaveWasm.game)} logo`}
          src={OriginGames.logoPath(mon.mostRecentSaveWasm.game)}
          style={{ height: 32 }}
        />
      </Flex>
      <Text>{mon.mostRecentSaveWasm.file_path}</Text>
    </Card>
  )
}
