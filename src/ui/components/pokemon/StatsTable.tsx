import { Table } from '@radix-ui/themes'
import { ContestStats, Stats, StatsPreSplit } from '../../../../packages/pokemon-files/src'

type StatsTableStandardProps = {
  stats: Stats
}

function StatsTableStandard({ stats }: StatsTableStandardProps) {
  return (
    <Table.Root className="stats-table" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>HP</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Atk</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Def</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>SpA</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>SpD</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Spe</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>{stats.hp}</Table.Cell>
          <Table.Cell>{stats.atk}</Table.Cell>
          <Table.Cell>{stats.def}</Table.Cell>
          <Table.Cell>{stats.spa}</Table.Cell>
          <Table.Cell>{stats.spd}</Table.Cell>
          <Table.Cell>{stats.spe}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  )
}

type StatsTableGameBoyProps = {
  stats: StatsPreSplit
}

function StatsTableGameBoy({ stats }: StatsTableGameBoyProps) {
  return (
    <Table.Root className="stats-table" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>HP</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Atk</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Def</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Spc</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Spe</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>{stats.hp}</Table.Cell>
          <Table.Cell>{stats.atk}</Table.Cell>
          <Table.Cell>{stats.def}</Table.Cell>
          <Table.Cell>{stats.spc}</Table.Cell>
          <Table.Cell>{stats.spe}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  )
}

type StatsTableContestProps = {
  stats: ContestStats
}

function StatsTableContest({ stats }: StatsTableContestProps) {
  return (
    <Table.Root className="stats-table" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Cool</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Beauty</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Cute</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Smart</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Tough</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>{stats.cool}</Table.Cell>
          <Table.Cell>{stats.beauty}</Table.Cell>
          <Table.Cell>{stats.cute}</Table.Cell>
          <Table.Cell>{stats.smart}</Table.Cell>
          <Table.Cell>{stats.tough}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  )
}

const StatsTable = {
  Standard: StatsTableStandard,
  GameBoy: StatsTableGameBoy,
  Contest: StatsTableContest,
}

export default StatsTable
