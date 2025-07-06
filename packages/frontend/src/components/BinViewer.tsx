import type { Bin, Request } from '@test-ai/types'
import React, { useState } from 'react'

interface BinViewerProps {
  bin: Bin
  onBack: () => void
}

const BinViewer: React.FC<BinViewerProps> = ({ bin, onBack }) => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers')
  const [copySuccess, setCopySuccess] = useState(false)

  const binUrl = `${window.location.origin}/b/${bin.id}/`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(binUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
    catch (err) {
      console.error('Failed to copy URL: ', err)
    }
  }

  return (
    <div>
      <h2>
        Bin:
        {bin.name || bin.id}
      </h2>
      <p>
        Send requests to:
        {' '}
        <code>{binUrl}</code>
        <button
          type="button"
          className="btn"
          onClick={copyToClipboard}
          style={{ marginLeft: '10px' }}
        >
          {copySuccess ? 'Copied!' : 'Copy URL'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onBack}
          style={{ marginLeft: '10px', background: '#666' }}
        >
          Back
        </button>
      </p>

      <div id="requests-container">
        <h3>Requests</h3>

        {bin.requests.length === 0
          ? (
              <p>No requests received yet. Send a request to the bin URL to see it here.</p>
            )
          : (
              <div className="request-container">
                <ul className="request-list">
                  {bin.requests.map((request: Request) => (
                    <li
                      key={request.id}
                      className={`request-item ${selectedRequest?.id === request.id ? 'active' : ''}`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div>
                        <span className="request-method">{request.method}</span>
                        <span className="request-path">{request.path}</span>
                        <span className="request-time">
                          {new Date(request.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {selectedRequest && (
                  <div className="request-details">
                    <h4>
                      <span className="request-method">{selectedRequest.method}</span>
                      <span className="request-path">{selectedRequest.path}</span>
                    </h4>

                    <div className="tab-container">
                      <div className="tab-buttons">
                        <button
                          type="button"
                          className={`tab-button ${activeTab === 'headers' ? 'active' : ''}`}
                          onClick={() => setActiveTab('headers')}
                        >
                          Headers
                        </button>
                        <button
                          type="button"
                          className={`tab-button ${activeTab === 'body' ? 'active' : ''}`}
                          onClick={() => setActiveTab('body')}
                          disabled={!selectedRequest.body}
                        >
                          Body
                        </button>
                      </div>

                      <div className="tab-content">
                        {activeTab === 'headers' && (
                          <div>
                            <pre>{JSON.stringify(selectedRequest.headers, null, 2)}</pre>
                          </div>
                        )}

                        {activeTab === 'body' && selectedRequest.body && (
                          <div>
                            <pre>{selectedRequest.body}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
      </div>
    </div>
  )
}

export default BinViewer
