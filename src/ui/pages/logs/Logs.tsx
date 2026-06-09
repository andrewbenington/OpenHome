import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option, R } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { cssClass } from '@openhome-ui/util/style'
import { CheckboxGroup, Text, TextField } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { CSSProperties, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry, LogLevel } from 'src/ui/backend/backendInterface'
import { DevDataDisplay } from 'src/ui/components/DevDataDisplay'
import { FilterIcon } from 'src/ui/components/Icons'
import { Popover } from 'src/ui/components/popover/Popover'
import ToggleButton from 'src/ui/components/ToggleButton'
import useDebounce from 'src/ui/hooks/useDebounce'
import useSimpleVirtualizer from 'src/ui/hooks/useSimpleVirtualizer'
import './Logs.css'

const LOG_LEVELS: readonly LogLevel[] = Object.freeze(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'])

export default function Logs() {
  const { loading, error, logs, filteredLogs, filterText, setFilterText, levels, setLevels } =
    useTodayLogs()
  const [selectedMon, setSelectedMon] = useState<OHPKM>()
  const ohpkmStore = useOhpkmStore()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerWidthRef = useRef(0)
  const excludedWidthRemRef = useRef(0)

  const virtualizer = useSimpleVirtualizer(
    filteredLogs?.length ?? 0,
    (logIndex, baseFontSize) =>
      estimateHeight(
        filteredLogs?.[logIndex],
        containerWidthRef.current - excludedWidthRemRef.current * baseFontSize,
        baseFontSize
      ),
    scrollRef
  )

  useEffect(() => {
    const measure = () => {
      const containerWidthPrev = containerWidthRef.current
      containerWidthRef.current = scrollRef.current?.getBoundingClientRect().width ?? 0

      const excludedWidthRemPrev = excludedWidthRemRef.current
      excludedWidthRemRef.current = calculateExcludedWidthRem()

      if (
        containerWidthRef.current !== containerWidthPrev ||
        excludedWidthRemRef.current !== excludedWidthRemPrev
      ) {
        virtualizer.measure() // force re-estimation
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (scrollRef.current) observer.observe(scrollRef.current)
    return () => observer.disconnect()
  }, [virtualizer])

  if (logs) {
    return (
      <div className="logs-page dark-scrollbar">
        <div className="logs-header">
          <h1 className="pokedex-header-title">OpenHome Logs</h1>
          <div style={{ flex: 1 }} />
          <Text>
            <b>Log count:</b> {logs.length}
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
        <div ref={scrollRef} className="logs-container">
          <div className="logs-scroll" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const log = filteredLogs[virtualRow.index]
              return (
                <LogLine
                  key={virtualRow.index}
                  log={log}
                  onOhpkmClick={(identifier) => setSelectedMon(ohpkmStore.getById(identifier))}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              )
            })}
          </div>
        </div>
        <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
      </div>
    )
  }
  return <div>{loading ? 'Loading' : error} </div>
}

type LogLineProps = {
  log: LogEntry
  onOhpkmClick: (openhomeId: OhpkmIdentifier) => void
  style?: CSSProperties
}

function LogLine({ log, onOhpkmClick, style }: LogLineProps) {
  const { ohpkm_id, timestamp, level, message, event } = log
  const mon = useOhpkmStore().getById(ohpkm_id ?? '')

  return (
    <div className="log-line" key={timestamp} style={style}>
      <span className="log-timestamp">{dayjs(timestamp).format('LTS')}</span>
      <span className={`log-level log-level-${level.toLowerCase()}`}>{level}</span>
      {event && <span className="log-event">{event}</span>}
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
      <DevDataDisplay className="log-context-button" data={log} label="context" />
    </div>
  )
}

function useTodayLogs() {
  const backend = useContext(BackendContext)
  const [logs, setLogs] = useState<LogEntry[]>()
  const { levels, setLevels, filterText, setFilterText } = useFilter(logs ?? [])

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
    ? ({
        logs,
        filteredLogs: logs.filter(
          (log) =>
            (!filterText ||
              log.message.toLocaleLowerCase().includes(filterText?.toLocaleLowerCase())) &&
            levels.has(log.level as LogLevel)
        ),
        filterText,
        setFilterText,
        levels,
        setLevels,
        loading: false,
        error: undefined,
      } as const)
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

function estimateLines(text: string, containerWidth: number, fontSize: number): number {
  const charWidth = getMonoCharWidth(fontSize, 'monospace')
  if (charWidth === undefined || charWidth === 0) return 1
  const charsPerLine = Math.floor(containerWidth / charWidth)
  if (charsPerLine === 0) {
    return 1
  }

  return Math.ceil(text.replace(/  +/g, ' ').length / charsPerLine)
}

function getMonoCharWidth(fontSize: number, fontFamily: string): Option<number> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined
  ctx.font = `${fontSize}px ${fontFamily}`
  return ctx.measureText('M').width
}

function estimateHeight(
  log: Option<LogEntry>,
  logMessageWidth: number,
  baseFontSize: number
): number {
  const fontSize = baseFontSize

  const lineCount = estimateLines(log?.message ?? '', logMessageWidth, fontSize)

  const baseHeightNoPadding = fontSize
  return baseHeightNoPadding + (fontSize * lineCount - 1)
}

const NON_MESSAGE_WIDTHS = [
  '--navigation-sidebar-width',
  '--timestamp-width',
  '--log-level-width',
  '--log-event-width',
  '--context-button-width',
]

function calculateExcludedWidthRem() {
  return (
    NON_MESSAGE_WIDTHS.reduce((sum, variable) => {
      const logsPage = document.getElementsByClassName('logs-page')?.[0]
      if (!logsPage) return 18
      const style = getComputedStyle(logsPage)

      return sum + parseFloat(style.getPropertyValue(variable)?.slice(0, -3))
    }, 0) +
    (NON_MESSAGE_WIDTHS.length - 1) * 0.5
  )
}
