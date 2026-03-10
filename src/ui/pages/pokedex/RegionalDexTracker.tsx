import { REGION_DEX_DATA, getRegionalDexCount } from '@openhome-ui/progression/dexTracker'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm/useOhpkmStore'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { useMemo, useState } from 'react'
import './style.css'

export default function RegionalDexTracker() {
  const [isExpanded, setIsExpanded] = useState(true)
  const ohpkmStore = useOhpkmStore()

  const allStored = useMemo(() => ohpkmStore.getAllStored() as OHPKM[], [ohpkmStore])

  const speciesPresent = useMemo(() => {
    const present = new Set<number>()
    for (const mon of allStored) {
      present.add(mon.dexNum)
    }
    return present
  }, [allStored])

  return (
    <div
      className="pokedex-sidebar"
      style={{
        width: '300px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
            color: 'var(--gray-12)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span>Regional Dex Progress</span>
          <span style={{ fontSize: 12, color: 'var(--gray-11)' }}>{isExpanded ? '▼' : '▶'}</span>
        </button>

        {isExpanded && (
          <div style={{ marginTop: 8 }}>
            {REGION_DEX_DATA.map((region) => {
              const count = getRegionalDexCount(speciesPresent, region.id)
              const completion = Math.round((count / region.totalSpecies) * 100)

              return (
                <div
                  key={region.id}
                  style={{
                    marginBottom: 10,
                    padding: '8px 10px',
                    background: 'var(--gray-7)',
                    borderRadius: 8,
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-12)' }}>
                      {region.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-11)' }}>
                      {count} / {region.totalSpecies}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      background: 'var(--gray-5)',
                      borderRadius: 4,
                      height: 6,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        background:
                          completion === 100
                            ? 'var(--green-9)'
                            : completion >= 75
                              ? 'var(--blue-9)'
                              : completion >= 50
                                ? 'var(--cyan-9)'
                                : 'var(--gray-9)',
                        height: '100%',
                        width: `${completion}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--gray-11)', textAlign: 'right' }}>
                    {completion}%
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
