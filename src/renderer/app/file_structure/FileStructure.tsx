import { Tab, TabList, Tabs, tabClasses } from '@mui/joy'
import { FileSchemas } from 'pokemon-files'
import { useState } from 'react'
import OHDataGrid, { SortableColumn } from 'src/renderer/components/OHDataGrid'
type ValueOf<T> = T[keyof T]
export function FileStructurePage() {
  const [tab, setTab] = useState<keyof typeof FileSchemas>('OHPKM')
  const columns: SortableColumn<ValueOf<typeof FileSchemas>['fields'][number]>[] = [
    // {
    //   key: 'display',
    //   name: 'Display',
    //   width: 80,

    //   renderCell: (params) => <DevDataDisplay data={params.row} />,
    //   cellClass: 'centered-cell',
    // },
    {
      key: 'byteOffset',
      name: 'Byte Offset',
      width: 100,
    },
    {
      key: 'numBytes',
      name: 'Size',
      width: 100,
    },
    {
      key: 'name',
      name: 'Field',
      width: 180,
    },
    {
      key: 'bitOffset',
      name: 'Bit Offset',
      width: 100,
    },
    {
      key: 'type',
      name: 'Type',
      width: 100,
    },
    {
      key: 'endian',
      name: 'Endian',
      width: 100,
    },
  ]
  return (
    <Tabs
      orientation="vertical"
      defaultValue="PK1"
      style={{ height: '100%', flex: 1, width: '100%' }}
      onChange={(_, val) => setTab(val as keyof typeof FileSchemas)}
    >
      <TabList
        disableUnderline
        sx={{
          whiteSpace: 'nowrap',
          p: 0.8,
          gap: 0.5,
          [`& .${tabClasses.root}`]: {
            borderRadius: 'lg',
          },
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
          },
        }}
        variant="solid"
        color="primary"
      >
        {Object.entries(FileSchemas).map(([fileType]) => (
          <Tab value={fileType} disableIndicator key={fileType}>
            {fileType}
          </Tab>
        ))}
      </TabList>
      <OHDataGrid
        rows={FileSchemas[tab].fields.filter(
          (field) => field.byteOffset !== undefined && field.numBytes !== undefined
        )}
        columns={columns}
        style={{ width: '100%', height: '100%' }}
      />
    </Tabs>
  )
}
