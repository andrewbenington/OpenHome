import React, { useRef } from 'react'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  onFileLoad: (bytes: Uint8Array, filename: string) => void
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const bytes = new Uint8Array(arrayBuffer)
      onFileLoad(bytes, file.name)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="wireframe-box text-center">
      <h2 className="wireframe-subtitle">Load a Radical Red save</h2>
      <p className="muted-text" style={{ marginBottom: '16px' }}>
        Choose a .sav file to browse, review, and refine your boxed Pokémon.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".sav"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button className="wireframe-button" onClick={() => fileInputRef.current?.click()}>
        <Upload className="icon" />
        Choose .sav file
      </button>
    </div>
  )
}
