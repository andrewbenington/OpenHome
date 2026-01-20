import { useState } from 'react'
import { BadgeCheck, KeyRound, User, Wallet } from 'lucide-react'
import { FileUpload } from './components/FileUpload'
import { BoxViewer } from './components/BoxViewer'
import { BagEditor } from './components/BagEditor'
import { PokemonDetailModal } from './components/PokemonDetailModal'
import { DarkModeToggle } from './components/DarkModeToggle'
import { SaveData, PokemonData, ItemSlot } from './lib/types'
import { parseSave, isRadicalRedSave, serializeSave } from './lib/saveParser'

function App() {
  const [saveData, setSaveData] = useState<SaveData | null>(null)
  const [selectedBox, setSelectedBox] = useState(0)
  const [selectedPokemon, setSelectedPokemon] = useState<{
    pokemon: PokemonData
    boxIndex: number
    slotIndex: number
  } | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [trainerDirty, setTrainerDirty] = useState(false)
  const [bagDirty, setBagDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<'box' | 'bag'>('box')

  const handleFileLoad = (bytes: Uint8Array, name: string) => {
    setError('')

    if (!isRadicalRedSave(bytes)) {
      setError('This does not appear to be a valid Radical Red save file.')
      return
    }

    try {
      const parsed = parseSave(bytes)
      setSaveData(parsed)
      setFilename(name)
      setSelectedBox(0)
      setTrainerDirty(false)
      setBagDirty(false)
      setActiveTab('box')
    } catch (err) {
      setError(`Error parsing save file: ${err}`)
      console.error(err)
    }
  }

  const handlePokemonClick = (pokemon: PokemonData, boxIndex: number, slotIndex: number) => {
    setSelectedPokemon({ pokemon, boxIndex, slotIndex })
  }

  const handlePokemonSave = (pokemon: PokemonData, boxIndex: number, slotIndex: number) => {
    if (!saveData) return

    const newSaveData = { ...saveData }
    newSaveData.boxes[boxIndex].pokemon[slotIndex] = pokemon

    const existingSlot = newSaveData.updatedBoxSlots.find(
      (slot) => slot.box === boxIndex && slot.index === slotIndex
    )
    if (!existingSlot) {
      newSaveData.updatedBoxSlots.push({ box: boxIndex, index: slotIndex })
    }

    setSaveData(newSaveData)
    setSelectedPokemon(null)
  }

  const handleTrainerUpdate = <K extends keyof SaveData>(field: K, value: SaveData[K]) => {
    if (!saveData) return
    if (field === 'trainerID' || field === 'secretID') return
    setSaveData({ ...saveData, [field]: value })
    setTrainerDirty(true)
  }

  const handleBagUpdate = (
    pocket: keyof SaveData['bag'],
    index: number,
    slot: ItemSlot
  ) => {
    if (!saveData) return
    const nextPocket = [...saveData.bag[pocket]]
    nextPocket[index] = slot
    setSaveData({
      ...saveData,
      bag: { ...saveData.bag, [pocket]: nextPocket },
    })
    setBagDirty(true)
  }

  const handleBagAddItem = (pocket: keyof SaveData['bag']) => {
    if (!saveData) return
    const nextPocket = [...saveData.bag[pocket]]
    const emptyIndex = nextPocket.findIndex((slot) => slot.itemId === 0 && slot.quantity === 0)
    if (emptyIndex === -1) return
    nextPocket[emptyIndex] = { itemId: 1, quantity: 1 }
    setSaveData({
      ...saveData,
      bag: { ...saveData.bag, [pocket]: nextPocket },
    })
    setBagDirty(true)
  }

  const handleBagRemoveItem = (pocket: keyof SaveData['bag'], index: number) => {
    if (!saveData) return
    const nextPocket = [...saveData.bag[pocket]]
    nextPocket[index] = { itemId: 0, quantity: 0 }
    setSaveData({
      ...saveData,
      bag: { ...saveData.bag, [pocket]: nextPocket },
    })
    setBagDirty(true)
  }

  const createTrainerNumberHandlers = (
    field: 'trainerID' | 'secretID' | 'money',
    min: number,
    max: number
  ) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? min : parseInt(e.target.value)
      if (!isNaN(val)) {
        handleTrainerUpdate(field, val as SaveData[typeof field])
      }
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value)
      if (isNaN(val) || val < min) {
        handleTrainerUpdate(field, min as SaveData[typeof field])
      } else if (val > max) {
        handleTrainerUpdate(field, max as SaveData[typeof field])
      }
    },
  })

  const handleDownload = () => {
    if (!saveData) return

    try {
      const modifiedBytes = serializeSave(saveData)

      const blob = new Blob([modifiedBytes as unknown as BlobPart], {
        type: 'application/octet-stream',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename.replace('.sav', '_modified.sav') || 'modified.sav'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(`Error saving file: ${err}`)
      console.error(err)
    }
  }

  const totalChanges = saveData
    ? saveData.updatedBoxSlots.length + (trainerDirty ? 1 : 0) + (bagDirty ? 1 : 0)
    : 0

  return (
    <div className="page">
      <header className="wireframe-box page-header">
        <div className="page-header-row">
          <div>
            <p className="page-eyebrow">Radical Red Suite</p>
            <h1 className="wireframe-title">Save Editor</h1>
          </div>
          <DarkModeToggle />
        </div>
        <p className="page-subtitle">
          Precision editing for Pokémon Radical Red .sav files with curated, secure workflows.
        </p>
      </header>

      {error && (
        <div className="wireframe-box status-card status-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!saveData ? (
        <FileUpload onFileLoad={handleFileLoad} />
      ) : (
        <>
          <div className="wireframe-box">
            <div className="trainer-info-header">
              <div>
                <p className="section-eyebrow">Trainer Profile</p>
                <h2 className="wireframe-subtitle">Identity & Ledger</h2>
              </div>
              <div className="save-action-buttons">
                <button
                  className="wireframe-button"
                  onClick={handleDownload}
                  disabled={totalChanges === 0}
                >
                  Download modified save
                  {totalChanges > 0 && ` (${totalChanges} changes)`}
                </button>
                <button
                  className="wireframe-button secondary"
                  onClick={() => {
                    setSaveData(null)
                    setFilename('')
                    setError('')
                    setTrainerDirty(false)
                    setBagDirty(false)
                  }}
                >
                  Load new file
                </button>
              </div>
            </div>
            <div className="trainer-form">
              <div className="trainer-field">
                <div className="trainer-field-label">
                  <User className="icon" />
                  <span>Trainer name</span>
                </div>
                <input
                  type="text"
                  className="wireframe-input"
                  value={saveData.trainerName}
                  onChange={(e) => handleTrainerUpdate('trainerName', e.target.value.slice(0, 7))}
                  maxLength={7}
                />
              </div>
              <div className="trainer-field is-locked">
                <div className="trainer-field-label">
                  <BadgeCheck className="icon" />
                  <span>Trainer ID</span>
                  <span className="field-lock-indicator">Locked</span>
                </div>
                <input
                  type="number"
                  className="wireframe-input"
                  value={saveData.trainerID}
                  disabled
                  min="0"
                  max="65535"
                />
              </div>
              <div className="trainer-field is-locked">
                <div className="trainer-field-label">
                  <KeyRound className="icon" />
                  <span>Secret ID</span>
                  <span className="field-lock-indicator">Locked</span>
                </div>
                <input
                  type="number"
                  className="wireframe-input"
                  value={saveData.secretID}
                  disabled
                  min="0"
                  max="65535"
                />
              </div>
              <div className="trainer-field">
                <div className="trainer-field-label">
                  <Wallet className="icon" />
                  <span>Money</span>
                </div>
                <input
                  type="number"
                  className="wireframe-input"
                  value={saveData.money}
                  {...createTrainerNumberHandlers('money', 0, 99999999)}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="wireframe-box">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Storage</p>
                <h2 className="wireframe-subtitle">Box & Bag</h2>
              </div>
              <div className="primary-tabs">
                <button
                  className={`primary-tab ${activeTab === 'box' ? 'active' : ''}`}
                  onClick={() => setActiveTab('box')}
                >
                  Box
                </button>
                <button
                  className={`primary-tab ${activeTab === 'bag' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bag')}
                >
                  Bag
                </button>
              </div>
            </div>

            {activeTab === 'box' ? (
              <>
                <h3 className="wireframe-subtitle">Box Selector</h3>
                <div className="box-selector">
                  {saveData.boxes.map((_, index) => (
                    <button
                      key={index}
                      className={`box-selector-button ${selectedBox === index ? 'active' : ''}`}
                      onClick={() => setSelectedBox(index)}
                    >
                      Box {index + 1}
                    </button>
                  ))}
                </div>
                <BoxViewer
                  box={saveData.boxes[selectedBox]}
                  boxIndex={selectedBox}
                  onPokemonClick={handlePokemonClick}
                />
              </>
            ) : (
              <div className="tab-panel">
                <BagEditor
                  bag={saveData.bag}
                  onUpdate={handleBagUpdate}
                  onAddItem={handleBagAddItem}
                  onRemoveItem={handleBagRemoveItem}
                  compact
                />
              </div>
            )}
          </div>

          {saveData.updatedBoxSlots.length > 0 && (
            <div className="wireframe-box status-card status-success">
              <strong>Modified slots:</strong> {saveData.updatedBoxSlots.length} Pokémon have been
              edited. Download the modified save to keep your updates.
            </div>
          )}
        </>
      )}

      {selectedPokemon && (
        <PokemonDetailModal
          pokemon={selectedPokemon.pokemon}
          boxIndex={selectedPokemon.boxIndex}
          slotIndex={selectedPokemon.slotIndex}
          onClose={() => setSelectedPokemon(null)}
          onSave={handlePokemonSave}
        />
      )}
    </div>
  )
}

export default App
