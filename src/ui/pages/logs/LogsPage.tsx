import { Input, Separator } from '@base-ui/react'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { cssClass } from '@openhome-ui/util/style'
import { CheckboxGroup, Spinner, Text, TextField, Tooltip } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { CSSProperties, useMemo, useRef, useState } from 'react'
import { LogEntry, LogLevel } from 'src/ui/backend/backendInterface'
import { Dialog } from 'src/ui/components/dialog/Dialog'
import { ExpandIcon, FilterIcon } from 'src/ui/components/Icons'
import { InfoGrid } from 'src/ui/components/InfoGrid'
import MiniButton from 'src/ui/components/MiniButton'
import { Popover } from 'src/ui/components/popover/Popover'
import ToggleButton from 'src/ui/components/ToggleButton'
import useSimpleVirtualizer from 'src/ui/hooks/useSimpleVirtualizer'
import { LOG_LEVELS, LogController, useLogController } from '.'
import './LogsPage.css'

const TIMESTAMP_DISPLAY = 'M/D/YY h:mm A'
const DATETIME_INPUT = 'YYYY-MM-DDTHH:mm'

export type LogsPageProps = {
  openhomeIdFilter?: OhpkmIdentifier
}

export default function LogsPage(props: LogsPageProps) {
  const { openhomeIdFilter } = props
  const logController = useLogController(openhomeIdFilter)
  const { loading, error, logs, filteredLogs } = logController
  const [selectedMon, setSelectedMon] = useState<OHPKM>()
  const ohpkmStore = useOhpkmStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [observing, setObserving] = useState(false)
  const [displayedLog, setDisplayedLog] = useState<LogEntry>()

  const virtualizer = useSimpleVirtualizer(
    (filteredLogs?.length ?? 0) + 1,
    (logIndex: number, baseFontSize: number) =>
      estimateHeight(
        filteredLogs?.[logIndex],
        (scrollRef.current?.getBoundingClientRect().width ?? 0) -
          calculateExcludedWidthRem() * baseFontSize,
        baseFontSize
      ),
    scrollRef
  )

  if (scrollRef.current && !observing) {
    const measure = () => {
      virtualizer.measure() // force re-estimation
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollRef.current)
    setObserving(true)
  }

  if (logs) {
    const { filterText, setFilterText, clearLogs, resetToToday, loadNext, current, next } =
      logController
    return (
      <div className="logs-page dark-scrollbar">
        <div className="logs-header">
          <h1 className="pokedex-header-title">
            {openhomeIdFilter ? 'Pokémon Logs' : 'OpenHome Logs'}
          </h1>
          {!openhomeIdFilter && (
            <button className="button-raised" onClick={clearLogs}>
              Delete Loaded Logs
            </button>
          )}
          <button className="button-raised" onClick={resetToToday}>
            Reset to Today
          </button>
          <div style={{ flex: 1 }} />
          <Text className="hide-small-width">
            <b>Log count:</b> {logs.length}
          </Text>
          <FilterPopover
            key={`${current.start.toISOString()}-${current.end.toISOString()}`}
            logController={logController}
          />
          <TextField.Root
            className="pokedex-filter-field"
            placeholder="Filter Text..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div ref={scrollRef} className="logs-container">
          <div className="logs-scroll" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              if (virtualRow.index === filteredLogs.length) {
                return (
                  <div
                    key="load-more"
                    className="logs-footer"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <button className="load-more-logs-button" onClick={loadNext}>
                      {loading ? (
                        <Spinner />
                      ) : (
                        `Load ${next?.start.format(TIMESTAMP_DISPLAY)} - ${next?.end.format(TIMESTAMP_DISPLAY)}...`
                      )}
                    </button>
                  </div>
                )
              }
              const log = filteredLogs[virtualRow.index]
              return (
                <LogLine
                  key={virtualRow.index}
                  log={log}
                  ohpkmButton={!openhomeIdFilter}
                  onOhpkmClick={(identifier) => setSelectedMon(ohpkmStore.getById(identifier))}
                  onDetailsClick={() => setDisplayedLog(log)}
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
        <Dialog.Container
          open={Boolean(displayedLog)}
          onOpenChange={(open) => !open && setDisplayedLog(undefined)}
          style={{ width: '80%', maxHeight: '90%', overflow: 'auto' }}
        >
          <InfoGrid data={displayedLog ?? {}} />
        </Dialog.Container>
      </div>
    )
  }
  return <div>{loading ? 'Loading' : error} </div>
}

type FilterPopoverProps = {
  logController: LogController
}

function FilterPopover(props: FilterPopoverProps) {
  const { levels, setLevels, current, loadRange } = props.logController
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [startInputValue, setStartInputValue] = useState<string>(
    current.start.format(DATETIME_INPUT)
  )
  const [endInputValue, setEndInputValue] = useState<string>(current.end.format(DATETIME_INPUT))
  const startInput = useRef<HTMLInputElement>(null)
  const [startInputValid, setStartInputValid] = useState(true)
  const [endInputValid, setEndInputValid] = useState(true)

  const startInputValueParsed = dayjs(startInputValue)
  const endInputValueParsed = dayjs(endInputValue)

  const validationMessage = useMemo(() => {
    if (!startInputValid) return `Start is invalid`
    if (!endInputValid) return `End is invalid`
    const startInputValueParsed = dayjs(startInputValue)
    const endInputValueParsed = dayjs(endInputValue)

    if (!startInputValueParsed.isBefore(endInputValueParsed)) {
      return 'Start must be before end'
    }

    if (endInputValueParsed.diff(startInputValueParsed, 'days') > 7) {
      return 'End must be no more than 7 days after start'
    }
  }, [startInputValid, endInputValid, startInputValue, endInputValue])

  function resetStart() {
    setStartInputValue(current.start.format(DATETIME_INPUT))
    setStartInputValid(true)
  }

  function resetEnd() {
    setEndInputValue(current.end.format(DATETIME_INPUT))
    setEndInputValid(true)
  }

  const loadLogsButton = (
    <button
      className="button-raised"
      disabled={validationMessage !== undefined}
      onClick={() => loadRange(startInputValueParsed, endInputValueParsed)}
    >
      Load Logs in Range
    </button>
  )

  return (
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
      <Popover.Portal container={document.getElementById('app-container')}>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="logs-filter-popover">
            <CheckboxGroup.Root
              value={Array.from(levels)}
              onValueChange={(value) => setLevels(new Set(value as LogLevel[]))}
            >
              {LOG_LEVELS.map((level) => (
                <span
                  key={level}
                  className={`log-level log-level-toggle log-level-${level.toLowerCase()}`}
                >
                  <CheckboxGroup.Item value={level}>{level}</CheckboxGroup.Item>
                </span>
              ))}
            </CheckboxGroup.Root>
            <Separator
              style={{ width: '100%', backgroundColor: 'var(--color-border-light)', height: 1 }}
            />
            <fieldset>
              <h3>Log Range</h3>
              <label className="log-range-label">
                <div>Start:</div>
                <Input
                  ref={startInput}
                  type="datetime-local"
                  value={startInputValue}
                  onChange={(e) => {
                    setStartInputValue(e.target.value)
                    setStartInputValid(e.target.validity.valid)
                  }}
                />
                <button className="button-raised" onClick={resetStart}>
                  Reset
                </button>
              </label>
              <label className="log-range-label">
                <div>End:</div>
                <Input
                  type="datetime-local"
                  value={endInputValue}
                  onChange={(e) => {
                    setEndInputValue(e.target.value)
                    setEndInputValid(e.target.validity.valid)
                  }}
                />
                <button className="button-raised" onClick={resetEnd}>
                  Reset
                </button>
              </label>
              {validationMessage ? (
                <Tooltip content={validationMessage}>{loadLogsButton}</Tooltip>
              ) : (
                loadLogsButton
              )}
            </fieldset>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

type LogLineProps = {
  log: LogEntry
  ohpkmButton: boolean
  onOhpkmClick?: (openhomeId: OhpkmIdentifier) => void
  onDetailsClick: () => void
  style?: CSSProperties
}

function LogLine(props: LogLineProps) {
  const { log, style, onOhpkmClick, ohpkmButton, onDetailsClick } = props
  const { ohpkm_id, timestamp, level, message, event } = log
  const mon = useOhpkmStore().getById(ohpkm_id ?? '')

  return (
    <div className="log-line" key={timestamp.toISOString()} style={style}>
      <span className="log-timestamp">{timestamp.format(TIMESTAMP_DISPLAY)}</span>
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
      {ohpkm_id && ohpkmButton && onOhpkmClick && mon && (
        <button className="log-ohpkm-button" onClick={() => onOhpkmClick(ohpkm_id)}>
          <PokemonIcon dexNumber={mon.dexNum} formeNumber={mon.formNum} />
        </button>
      )}
      <MiniButton onClick={onDetailsClick} icon={ExpandIcon} />
    </div>
  )
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
      if (!logsPage) return 0

      const style = getComputedStyle(logsPage)

      return sum + parseFloat(style.getPropertyValue(variable)?.slice(0, -3))
    }, 0) +
    (NON_MESSAGE_WIDTHS.length - 1) * 0.5
  )
}

function estimateLines(text: string, containerWidth: number, fontSize: number): number {
  const charWidth = getMonoCharWidth(fontSize, 'monospace')
  if (charWidth === undefined || charWidth < 1) return 1
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
  const fontSize = baseFontSize * 0.9

  const lineCount = estimateLines(log?.message ?? '', logMessageWidth, fontSize)

  const baseHeightNoPadding = fontSize
  return baseHeightNoPadding + (fontSize * lineCount - 1)
}
