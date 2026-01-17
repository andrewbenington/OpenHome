import React, { useRef } from 'react'

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
      <h2 className="wireframe-subtitle">Load Radical Red Save File</h2>
      <p style={{ marginBottom: '16px' }}>
        Select your .sav file to view and edit your Pokemon boxes
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".sav"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        className="wireframe-button"
        onClick={() => fileInputRef.current?.click()}
      >
        Choose .sav File
      </button>
    </div>
  )
}
