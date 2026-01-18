import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { BoxViewer } from './components/BoxViewer'
import { PokemonDetailModal } from './components/PokemonDetailModal'
import { DarkModeToggle } from './components/DarkModeToggle'
import { SaveData, PokemonData } from './lib/types'
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
              <div className="trainer-info">
                <div>
                  <span className="trainer-label">Trainer</span>
                  <span className="trainer-value">{saveData.trainerName}</span>
                </div>
                <div>
                  <span className="trainer-label">ID</span>
                  <span className="trainer-value">
                    {saveData.trainerID.toString().padStart(5, '0')}
                  </span>
                </div>
                <div>
                  <span className="trainer-label">Money</span>
                  <span className="trainer-value">${saveData.money.toLocaleString()}</span>
                </div>
              </div>
              <div className="save-action-buttons">
                <button
                  className="wireframe-button"
                  onClick={handleDownload}
                  disabled={saveData.updatedBoxSlots.length === 0}
                >
                  Download modified save
                  {saveData.updatedBoxSlots.length > 0 &&
                    ` (${saveData.updatedBoxSlots.length} changes)`}
                </button>
                <button
                  className="wireframe-button"
                  onClick={() => {
                    setSaveData(null)
                    setFilename('')
                    setError('')
                  }}
                >
                  Load new file
                </button>
              </div>
            </div>
          </div>

          <div className="wireframe-box">
            <h2 className="wireframe-subtitle">Box Selector</h2>
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
          </div>

          <div className="wireframe-box">
            <BoxViewer
              box={saveData.boxes[selectedBox]}
              boxIndex={selectedBox}
              onPokemonClick={handlePokemonClick}
            />
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
