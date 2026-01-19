import React, { useMemo, useState } from 'react'
import {
  Backpack,
  Circle,
  CircleDot,
  KeyRound,
  Leaf,
  Search,
  PackagePlus,
  Plus,
  Trash2,
  X,
  ArrowUpDown,
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
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'quantity'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const itemOptions = useMemo(
    () => [{ id: 0, name: 'None' }, ...RADICAL_RED_ITEMS],
    []
  )
  const itemNameLookup = useMemo(
    () => new Map(itemOptions.map((item) => [item.id, item.name])),
    [itemOptions]
  )

  const pocketEntries = useMemo(() => {
    const slots = bag[activePocket]
    return slots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.itemId > 0 || slot.quantity > 0)
  }, [bag, activePocket])

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const results = term
      ? pocketEntries.filter((slot) =>
          (itemNameLookup.get(slot.itemId) ?? '').toLowerCase().includes(term)
        )
      : pocketEntries

    return [...results].sort((a, b) => {
      if (sortKey === 'quantity') {
        return sortDirection === 'asc'
          ? a.quantity - b.quantity
          : b.quantity - a.quantity
      }
      const nameA = (itemNameLookup.get(a.itemId) ?? '').toLowerCase()
      const nameB = (itemNameLookup.get(b.itemId) ?? '').toLowerCase()
      return sortDirection === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    })
  }, [itemNameLookup, pocketEntries, searchTerm, sortDirection, sortKey])

  const totalQuantity = useMemo(
    () => pocketEntries.reduce((sum, slot) => sum + slot.quantity, 0),
    [pocketEntries]
  )

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

      <div className="bag-controls">
        <div className="bag-controls-main">
          <div className="bag-field">
            <label className="form-label" htmlFor="bag-search">
              Search items
            </label>
            <div className="input-with-icon">
              <Search className="icon" />
              <input
                id="bag-search"
                className="wireframe-input"
                placeholder="Search by item name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="icon" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="bag-field">
            <label className="form-label" htmlFor="bag-sort">
              Sort pocket
            </label>
            <div className="bag-sort-controls">
              <select
                id="bag-sort"
                className="wireframe-input wireframe-select"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
              >
                <option value="name">Item name</option>
                <option value="quantity">Quantity</option>
              </select>
              <button
                type="button"
                className="wireframe-button ghost icon-only"
                onClick={() =>
                  setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
                }
                aria-label="Toggle sort direction"
              >
                <ArrowUpDown className="icon" />
              </button>
            </div>
          </div>
        </div>
        <div className="bag-summary">
          <div>
            Showing <strong>{filteredEntries.length}</strong> of{' '}
            <strong>{pocketEntries.length}</strong> items
          </div>
          <div>
            Total quantity <strong>{totalQuantity}</strong>
          </div>
        </div>
      </div>

      <div className="bag-grid">
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus className="icon" />
            </div>
            <div>
              <div className="empty-state-title">
                {pocketEntries.length === 0 ? 'No items in this pocket' : 'No matching items'}
              </div>
              <div className="empty-state-subtitle">
                {pocketEntries.length === 0
                  ? 'Add an item to start tracking quantities in this pocket.'
                  : 'Try adjusting your search or sort filters.'}
              </div>
            </div>
          </div>
        ) : (
          filteredEntries.map((slot) => (
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
