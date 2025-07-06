import type { Bin } from '@test-ai/types'
import React from 'react'

interface BinListProps {
  bins: Bin[]
  onBinSelected: (bin: Bin) => void
}

const BinList: React.FC<BinListProps> = ({ bins, onBinSelected }) => {
  return (
    <div className="sidebar">
      <h2>Your Bins</h2>
      {bins.length === 0
        ? (
            <p>No bins created yet.</p>
          )
        : (
            <ul className="bin-list">
              {bins.map(bin => (
                <li
                  key={bin.id}
                  className="bin-item"
                  onClick={() => onBinSelected(bin)}
                >
                  {bin.name || bin.id}
                  <div className="bin-item-meta">
                    {bin.requests.length}
                    {' '}
                    {bin.requests.length === 1 ? 'request' : 'requests'}
                    {' '}
                    •
                    {new Date(bin.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
    </div>
  )
}

export default BinList
