import type { Bin, Request } from '@test-ai/types'
import React, { useEffect, useState } from 'react'
import BinCreator from './BinCreator.js'
import BinList from './BinList.js'
import BinViewer from './BinViewer.js'

const App: React.FC = () => {
  const [bins, setBins] = useState<Bin[]>([])
  const [currentBin, setCurrentBin] = useState<Bin | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  // const [clientId, setClientId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'bin' | 'list'>('home')

  // Go back to the bin list
  const goBack = () => {
    setView('list')
  }

  // View a specific bin
  const viewBin = React.useCallback(
    (bin: Bin) => {
      setCurrentBin(bin)
      setView('bin')

      // Subscribe to bin updates
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', binId: bin.id }))
      }
    },
    [ws]
  )

  // Handle request received event
  const handleRequestReceived = React.useCallback(
    (bin: Bin, _request: Request) => {
      // Update the bin in our list
      setBins(prevBins => prevBins.map(b => (b.id === bin.id ? bin : b)))

      // If this is the current bin, update it
      if (currentBin && bin.id === currentBin.id) {
        setCurrentBin(bin)
      }
    },
    [currentBin]
  )

  // Handle bin created event
  const handleBinCreated = React.useCallback(
    (bin: Bin) => {
      setBins(prevBins => [...prevBins, bin])

      // If this is the first bin, show the bins list
      if (bins.length === 0) {
        setView('list')
      }

      // If this is the bin we just created, view it
      if (currentBin && bin.id === currentBin.id) {
        viewBin(bin)
      }
    },
    [bins, currentBin, viewBin]
  )

  // Load all bins
  const loadBins = async () => {
    try {
      const response = await fetch('/api/bins')
      if (!response.ok) {
        throw new Error('Failed to load bins')
      }

      const data = await response.json()
      setBins(data.bins)

      if (data.bins.length > 0) {
        setView('list')
      }
    } catch (error) {
      console.error('Error loading bins:', error)
    }
  }

  // Create a new bin
  const createBin = async (name: string) => {
    try {
      const response = await fetch('/api/bins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to create bin')
      }

      const data = await response.json()
      return data.bin
    } catch (error) {
      console.error('Error creating bin:', error)
      throw error
    }
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.host}/ws`)

    socket.onopen = () => {
      console.log('WebSocket connection established')
      setWs(socket)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)
      console.log('WebSocket message received:', data)

      if (data.type === 'CONNECTED') {
        // setClientId(data.clientId);
        loadBins()
      } else if (data.type === 'BIN_CREATED') {
        handleBinCreated(data.bin)
      } else if (data.type === 'REQUEST_RECEIVED') {
        handleRequestReceived(data.bin, data.request)
      }
    }

    socket.onclose = () => {
      console.log('WebSocket connection closed')
      setWs(null)
      // Try to reconnect after a delay
      const reconnectTimeout = setTimeout(() => {
        setWs(new WebSocket(`ws://${window.location.host}/ws`))
      }, 3000)
      return () => clearTimeout(reconnectTimeout)
    }

    socket.onerror = error => {
      console.error('WebSocket error:', error)
    }

    return () => {
      socket.close()
    }
  }, [handleBinCreated, handleRequestReceived])

  // Render the appropriate view
  return (
    <div className="app-container">
      <h1>RequestBin Clone</h1>
      <p>A simple service to inspect HTTP requests.</p>

      {view === 'home' && (
        <BinCreator onBinCreated={(bin: Bin) => viewBin(bin)} createBin={createBin} />
      )}

      {view === 'list' && (
        <div className="container">
          <BinList bins={bins} onBinSelected={viewBin} />
          <div className="main-content">
            <div id="bin-details">
              <p>Select a bin to view its details</p>
            </div>
          </div>
        </div>
      )}

      {view === 'bin' && currentBin && <BinViewer bin={currentBin} onBack={goBack} />}

      <hr />

      <h2>API Documentation</h2>
      <h3>Create a bin</h3>
      <pre>
        POST /api/bins
        {'{'}
        "name": "Optional Bin Name"
        {'}'}
      </pre>

      <h3>List all bins</h3>
      <pre>GET /api/bins</pre>

      <h3>Get a specific bin</h3>
      <pre>GET /api/bins/:id</pre>

      <h3>Delete a bin</h3>
      <pre>DELETE /api/bins/:id</pre>

      <h3>Send requests to a bin</h3>
      <p>
        Any HTTP request sent to
        <code>/b/:id/*</code> will be captured.
      </p>
      <pre>POST /b/:id/anything</pre>

      <h2>WebSocket API</h2>
      <p>Connect to WebSocket to receive real-time updates:</p>
      <pre>const ws = new WebSocket('ws://' + window.location.host + '/ws');</pre>

      <p>Subscribe to a bin:</p>
      <pre>
        ws.send(JSON.stringify
        {'{{'} type: 'SUBSCRIBE', binId: 'your-bin-id'
        {'}}'}
        );
      </pre>
    </div>
  )
}

export default App
