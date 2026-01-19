import React, { useMemo, useState } from 'react'
import {
  Backpack,
  Circle,
  CircleDot,
  KeyRound,
  Leaf,
  PackagePlus,
  Plus,
  Trash2,
} from 'lucide-react'
import { BagData, ItemSlot } from '../lib/types'
import { RADICAL_RED_ITEMS } from '../lib/radicalRedItems'

type BagPocketKey = keyof BagData

interface BagEditorProps {
  bag: BagData
  onUpdate: (pocket: BagPocketKey, index: number, slot: ItemSlot) => void
  onAddItem: (pocket: BagPocketKey) => void
  onRemoveItem: (pocket: BagPocketKey, index: number) => void
  compact?: boolean
}

const pocketConfigs: Array<{
  key: BagPocketKey
  label: string
  icon: React.ReactNode
}> = [
  { key: 'items', label: 'Items', icon: <Backpack className="icon" /> },
  { key: 'keyItems', label: 'Key Items', icon: <KeyRound className="icon" /> },
  { key: 'balls', label: 'Balls', icon: <Circle className="icon" /> },
  { key: 'tms', label: 'TMs/HMs', icon: <CircleDot className="icon" /> },
  { key: 'berries', label: 'Berries', icon: <Leaf className="icon" /> },
]

export const BagEditor: React.FC<BagEditorProps> = ({
  bag,
  onUpdate,
  onAddItem,
  onRemoveItem,
  compact = false,
}) => {
  const [activePocket, setActivePocket] = useState<BagPocketKey>('items')
  const itemOptions = useMemo(
    () => [{ id: 0, name: 'None' }, ...RADICAL_RED_ITEMS],
    []
  )

  const entries = useMemo(() => {
    const slots = bag[activePocket]
    return slots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.itemId > 0 || slot.quantity > 0)
  }, [bag, activePocket])

  return (
    <div className={`bag-editor ${compact ? 'compact' : ''}`}>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Bag Inventory</p>
          <h2 className="wireframe-subtitle">Pocket Editor</h2>
        </div>
        <button className="wireframe-button" onClick={() => onAddItem(activePocket)}>
          <PackagePlus className="icon" />
          Add item
        </button>
      </div>

      <div className="bag-pocket-tabs">
        {pocketConfigs.map((pocket) => (
          <button
            key={pocket.key}
            className={`bag-pocket-tab ${activePocket === pocket.key ? 'active' : ''}`}
            onClick={() => setActivePocket(pocket.key)}
          >
            {pocket.icon}
            {pocket.label}
          </button>
        ))}
      </div>

      <div className="bag-grid">
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus className="icon" />
            </div>
            <div>
              <div className="empty-state-title">No items in this pocket</div>
              <div className="empty-state-subtitle">
                Add an item to start tracking quantities in this pocket.
              </div>
            </div>
          </div>
        ) : (
          entries.map((slot) => (
            <div key={slot.index} className="bag-row">
              <div>
                <label className="form-label">Item</label>
                <select
                  className="wireframe-input wireframe-select"
                  value={slot.itemId}
                  onChange={(e) =>
                    onUpdate(activePocket, slot.index, {
                      itemId: Math.max(0, parseInt(e.target.value) || 0),
                      quantity: slot.quantity,
                    })
                  }
                >
                  {itemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={slot.quantity}
                  onChange={(e) =>
                    onUpdate(activePocket, slot.index, {
                      itemId: slot.itemId,
                      quantity: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  min="0"
                />
              </div>
              <button
                className="wireframe-button ghost"
                onClick={() => onRemoveItem(activePocket, slot.index)}
              >
                <Trash2 className="icon" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
