import type { Bin } from '@test-ai/types'
import React, { useState } from 'react'

interface BinCreatorProps {
  createBin: (name: string) => Promise<Bin>
  onBinCreated: (bin: Bin) => void
}

const BinCreator: React.FC<BinCreatorProps> = ({ createBin, onBinCreated }) => {
  const [binName, setBinName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(
    null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCreating) return

    setIsCreating(true)
    setNotification({ message: 'Creating bin...', isError: false })

    try {
      const bin = await createBin(binName)
      setNotification({ message: 'Bin created successfully!', isError: false })
      setBinName('')
      onBinCreated(bin)
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to create bin',
        isError: true,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div id="create-bin-form">
      <h2>Create a New Bin</h2>
      <form id="bin-form" onSubmit={handleSubmit}>
        <input
          type="text"
          id="bin-name"
          placeholder="Optional Bin Name"
          value={binName}
          onChange={e => setBinName(e.target.value)}
          disabled={isCreating}
        />
        <button type="submit" className="btn" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Bin'}
        </button>
      </form>

      {notification && (
        <div
          className={`notification ${notification.isError ? 'error' : ''}`}
          style={{
            borderLeftColor: notification.isError ? '#e74c3c' : '#0070f3',
            display: 'block',
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default BinCreator
