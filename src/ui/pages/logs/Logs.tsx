import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { cssClass } from '@openhome-ui/util/style'
import { CheckboxGroup, Text, TextField } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { useCallback, useContext, useEffect, useState } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry, LogLevel } from 'src/ui/backend/backendInterface'
import { DevDataDisplay } from 'src/ui/components/DevDataDisplay'
import { FilterIcon } from 'src/ui/components/Icons'
import { Popover } from 'src/ui/components/popover/Popover'
import ToggleButton from 'src/ui/components/ToggleButton'
import useDebounce from 'src/ui/hooks/useDebounce'
import './Logs.css'

const LOG_LEVELS: readonly LogLevel[] = Object.freeze(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'])

export default function Logs() {
  const logData = useTodayLogs()
  const { levels, setLevels, filterText, setFilterText } = useFilter(logData.logs ?? [])
  const [selectedMon, setSelectedMon] = useState<OHPKM>()
  const ohpkmStore = useOhpkmStore()
  const [filtersOpen, setFiltersOpen] = useState(false)

  if (logData.logs) {
    return (
      <div className="logs-page">
        <div className="logs-header">
          <h1 className="pokedex-header-title">OpenHome Logs</h1>
          <div style={{ flex: 1 }} />
          <Text>
            <b>Log count:</b> {logData.logs.length}
          </Text>
          <Popover.Root open={filtersOpen} onOpenChange={(v) => setFiltersOpen(v)}>
            <Popover.Trigger
              render={(props) => (
                <ToggleButton
                  icon={FilterIcon}
                  state={filtersOpen}
                  setState={setFiltersOpen}
                  toggledClassName="filter-button-toggled"
                  untoggledClassName="filter-button-untoggled"
                  {...props}
                />
              )}
            />
            <Popover.Portal>
              <Popover.Positioner sideOffset={8}>
                <Popover.Popup className="logs-filter-popover">
                  <CheckboxGroup.Root
                    value={Array.from(levels)}
                    onValueChange={(value) => setLevels(new Set(value as LogLevel[]))}
                  >
                    {LOG_LEVELS.map((level) => (
                      <CheckboxGroup.Item key={level} value={level}>
                        <span className={`log-level log-level-${level.toLowerCase()}`}>
                          {level}
                        </span>
                      </CheckboxGroup.Item>
                    ))}
                  </CheckboxGroup.Root>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <TextField.Root
            className="pokedex-filter-field"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="logs-container">
          {logData.logs
            .filter(
              (log) =>
                (!filterText ||
                  log.message.toLocaleLowerCase().includes(filterText?.toLocaleLowerCase())) &&
                levels.has(log.level as LogLevel)
            )
            .map((log) => (
              <LogLine
                key={log.timestamp}
                log={log}
                onOhpkmClick={(identifier) => setSelectedMon(ohpkmStore.getById(identifier))}
              />
            ))}
        </div>
        <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
      </div>
    )
  }
  return <div>{logData.loading ? 'Loading' : logData.error} </div>
}

type LogLineProps = {
  log: LogEntry
  onOhpkmClick: (openhomeId: OhpkmIdentifier) => void
}

function LogLine({ log, onOhpkmClick }: LogLineProps) {
  const { ohpkm_id, timestamp, level, message } = log
  const mon = useOhpkmStore().getById(ohpkm_id ?? '')

  return (
    <div className="log-line" key={timestamp}>
      <span className="log-timestamp">{dayjs(timestamp).format('LTS')}</span>
      <span className={`log-level log-level-${level.toLowerCase()}`}>{level}</span>
      <span
        className={cssClass('log-message')
          .with('log-message-empty')
          .if(message === '(empty)')
          .build()}
      >
        {message}
      </span>
      {ohpkm_id && mon && (
        <button className="log-ohpkm-button" onClick={() => onOhpkmClick(ohpkm_id)}>
          <PokemonIcon dexNumber={mon.dexNum} formeNumber={mon.formNum} />
        </button>
      )}
      <DevDataDisplay data={log} label="context" />
    </div>
  )
}

function useTodayLogs() {
  const backend = useContext(BackendContext)
  const [logs, setLogs] = useState<LogEntry[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const getLogs = useCallback(() => {
    setLoading(true)
    backend
      .getLogs()
      .then(R.match(setLogs, setError))
      .finally(() => setLoading(false))
  }, [backend])

  const debouncedGetLogs = useDebounce(getLogs, 300)
  backend.onNewLog((_notification) => {
    debouncedGetLogs()
  })

  useEffect(() => {
    if (logs === undefined) {
      getLogs()
    }
  }, [getLogs, logs])

  return logs
    ? ({ logs, loading: false, error: undefined } as const)
    : ({ logs: undefined, loading, error } as const)
}

function useFilter(logs: LogEntry[]) {
  const [levels, setLevels] = useState(new Set(LOG_LEVELS))
  const [filterText, setFilterText] = useState('')

  const filteredLogs = logs.filter(
    (log) =>
      (!filterText || log.message.toLocaleLowerCase().includes(filterText?.toLocaleLowerCase())) &&
      levels.has(log.level as LogLevel)
  )

  return {
    levels,
    setLevels,
    filterText,
    setFilterText,
    filteredLogs,
  }
}
