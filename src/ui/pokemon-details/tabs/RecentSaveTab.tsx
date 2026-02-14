import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { OriginGames } from '@pkm-rs/pkg'
import { Button, Card, Flex, Text } from '@radix-ui/themes'
import { useContext } from 'react'

export default function RecentSaveTab(props: { mon: OHPKM }) {
  const { mon } = props
  const backend = useContext(BackendContext)

  if (!mon.mostRecentSaveWasm) {
    return <div style={{ padding: 8 }}>No recent save data available.</div>
  }

  const filePath = mon.mostRecentSaveWasm.file_path

  return (
    <Flex direction="column" p="2">
      <Card style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Flex align="center">
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
        <Text>{filePath}</Text>
        <Flex justify="end">
          <Button
            size="1"
            style={{ width: 'fit-content' }}
            onClick={() => backend.openFileLocation(filePath)}
          >
            Open File Location
          </Button>
        </Flex>
      </Card>
    </Flex>
  )
}
