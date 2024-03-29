import { Button, MenuItem, Pagination, Select } from '@mui/material'
import { useEffect, useState } from 'react'
import { useFilePicker } from 'use-file-picker'
import PokemonDisplay from '../../renderer/pokemon/PokemonDisplay'
import { bytesToPKM } from '../../util/FileImport'
import { PKM } from './PKM'

const acceptableExtensions = [
  'OHPKM',
  'PKM',
  'PK1',
  'PK2',
  'COLOPKM',
  'XDPKM',
  'PK5',
  'PK6',
  'PK7',
  'PB7',
  'PK8',
  'PA8',
  'PB8',
  'PK9',
]

const PKMLoader = () => {
  const [openFileSelector, { filesContent }] = useFilePicker({
    accept: acceptableExtensions,
    readAs: 'ArrayBuffer',
  })
  const [mons, setMons] = useState<PKM[]>([])
  const [propTab, setPropTab] = useState('summary')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(100)
  useEffect(() => {
    // getMoves();
  }, [])
  useEffect(() => {
    if (filesContent) {
      const fileMons = filesContent.map((fileContent) => {
        const bytes = new Uint8Array(fileContent.content as unknown as ArrayBuffer)
        const [extension] = fileContent.name.split('.').slice(-1)
        return bytesToPKM(bytes, extension)
      })
      setMons(fileMons)
      setPage(0)
    }
  }, [filesContent])
  return (
    <>
      <div style={{ display: 'flex' }}>
        <Button variant="contained" onClick={() => openFileSelector()}>
          Open PKM
        </Button>
        <Select
          value={propTab}
          onChange={(event) => setPropTab((event?.target?.value as string) ?? 'summary')}
        >
          <MenuItem value="summary">Summary</MenuItem>
          <MenuItem value="stats">Stats</MenuItem>
          <MenuItem value="ribbons">Ribbons</MenuItem>
          <MenuItem value="raw">Raw</MenuItem>
        </Select>
      </div>
      {mons
        ?.slice(page * pageSize, (page + 1) * pageSize)
        ?.map((mon, i) => (
          <PokemonDisplay key={`pokemon_${i}`} mon={mon} tab="" setTab={() => {}} />
        ))}
      <Pagination
        count={Math.ceil(mons.length / 100)}
        page={page + 1}
        onChange={(_, p) => setPage(p - 1)}
      />
      {/* <TablePagination
        component="div"
        count={mons.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          setPageSize(parseInt(event.target.value));
        }}
      /> */}
    </>
  )
}

export default PKMLoader
