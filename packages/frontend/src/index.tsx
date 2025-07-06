import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App.js'

// Create a root element for React to render into
const rootElement = document.getElementById('root')
if (!rootElement) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

// Render the React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
