import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { WebSocketServer } from 'ws'
import { BinService } from './application/services/bin-service.js'
import { createBinApi } from './infrastructure/adapters/primary/api/bin-api.js'
import { WebSocketNotificationService } from './infrastructure/adapters/primary/websocket/websocket-notification-service.js'
import { InMemoryBinRepository } from './infrastructure/adapters/secondary/in-memory-bin-repository.js'

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create the main app
const app = new Hono()

// Create the WebSocket server
const wss = new WebSocketServer({ noServer: true })

// Create the infrastructure adapters
const binRepository = new InMemoryBinRepository()
const notificationService = new WebSocketNotificationService(wss)

// Create the application services
const binService = new BinService(binRepository, notificationService)

// Create and mount the API
const binApi = createBinApi(binService)
app.route('/', binApi)

// Serve static files
app.use('/bundle.js', serveStatic({ path: path.join(__dirname, '../../dist/public/bundle.js') }))

// Serve the React app for the home page
app.get('/', serveStatic({ path: path.join(__dirname, '../../dist/public/index.html') }))

// Keep the old HTML page for reference (commented out)
app.get('/old', c => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RequestBin Clone</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          line-height: 1.6;
        }
        h1 { color: #333; }
        .btn {
          display: inline-block;
          background: #0070f3;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          text-decoration: none;
          margin-top: 1rem;
          border: none;
          cursor: pointer;
        }
        .btn:hover {
          background: #0051a8;
        }
        code {
          background: #f4f4f4;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
        }
        pre {
          background: #f4f4f4;
          padding: 1rem;
          border-radius: 5px;
          overflow-x: auto;
        }
        input {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #ddd;
          margin-right: 0.5rem;
        }
        .container {
          display: flex;
          margin-top: 2rem;
        }
        .sidebar {
          width: 30%;
          padding-right: 1rem;
        }
        .main-content {
          width: 70%;
        }
        .bin-list {
          list-style: none;
          padding: 0;
        }
        .bin-item {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .bin-item:hover, .bin-item.active {
          background: #f4f4f4;
        }
        .request-list {
          list-style: none;
          padding: 0;
        }
        .request-item {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .request-method {
          font-weight: bold;
          margin-right: 0.5rem;
        }
        .request-path {
          color: #0070f3;
        }
        .request-time {
          color: #666;
          font-size: 0.8rem;
        }
        .request-details {
          margin-top: 0.5rem;
        }
        .hidden {
          display: none;
        }
        .tab-container {
          margin-top: 1rem;
        }
        .tab-buttons {
          display: flex;
          border-bottom: 1px solid #ddd;
        }
        .tab-button {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
        }
        .tab-button.active {
          border-bottom: 2px solid #0070f3;
          font-weight: bold;
        }
        .tab-content {
          padding: 1rem 0;
        }
        .notification {
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
          background: #f8f9fa;
          border-left: 4px solid #0070f3;
        }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script src="/bundle.js"></script>

      <script>
        // State
        let currentBin = null;
        let bins = [];
        let ws = null;
        let clientId = null;

        // DOM Elements
        const binForm = document.getElementById('bin-form');
        const binNameInput = document.getElementById('bin-name');
        const createNotification = document.getElementById('create-notification');
        const binView = document.getElementById('bin-view');
        const binTitle = document.getElementById('bin-title');
        const binUrl = document.getElementById('bin-url');
        const copyUrlButton = document.getElementById('copy-url');
        const backButton = document.getElementById('back-button');
        const requestList = document.getElementById('request-list');
        const noRequests = document.getElementById('no-requests');
        const binsContainer = document.getElementById('bins-container');
        const binList = document.getElementById('bin-list');

        // Initialize WebSocket connection
        function initWebSocket() {
          ws = new WebSocket('ws://' + window.location.host + '/ws');

          ws.onopen = () => {
            console.log('WebSocket connection established');
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            if (data.type === 'CONNECTED') {
              clientId = data.clientId;
              console.log('Connected with client ID:', clientId);

              // Load bins after connection
              loadBins();
            } else if (data.type === 'BIN_CREATED') {
              handleBinCreated(data.bin);
            } else if (data.type === 'REQUEST_RECEIVED') {
              handleRequestReceived(data.bin, data.request);
            }
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed');
            // Try to reconnect after a delay
            setTimeout(initWebSocket, 3000);
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          };
        }

        // Create a new bin
        async function createBin(name) {
          try {
            const response = await fetch('/api/bins', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name }),
            });

            if (!response.ok) {
              throw new Error('Failed to create bin');
            }

            const data = await response.json();
            return data.bin;
          } catch (error) {
            console.error('Error creating bin:', error);
            throw error;
          }
        }

        // Load all bins
        async function loadBins() {
          try {
            const response = await fetch('/api/bins');
            if (!response.ok) {
              throw new Error('Failed to load bins');
            }

            const data = await response.json();
            bins = data.bins;

            if (bins.length > 0) {
              binsContainer.classList.remove('hidden');
              renderBinList();
            }
          } catch (error) {
            console.error('Error loading bins:', error);
          }
        }

        // Render the list of bins
        function renderBinList() {
          binList.innerHTML = '';

          bins.forEach(bin => {
            const li = document.createElement('li');
            li.className = 'bin-item';
            li.textContent = bin.name || bin.id;
            li.dataset.id = bin.id;

            li.addEventListener('click', () => {
              viewBin(bin);
            });

            binList.appendChild(li);
          });
        }

        // View a specific bin
        function viewBin(bin) {
          currentBin = bin;

          // Update UI
          binTitle.textContent = bin.name || bin.id;
          binUrl.textContent = \`\${window.location.origin}/b/\${bin.id}/\`;

          // Show/hide elements
          binView.classList.remove('hidden');
          binsContainer.classList.add('hidden');

          // Subscribe to bin updates
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'SUBSCRIBE', binId: bin.id }));
          }

          // Render requests
          renderRequests();
        }

        // Render the requests for the current bin
        function renderRequests() {
          requestList.innerHTML = '';

          if (!currentBin || !currentBin.requests || currentBin.requests.length === 0) {
            noRequests.classList.remove('hidden');
            return;
          }

          noRequests.classList.add('hidden');

          currentBin.requests.forEach(request => {
            const li = document.createElement('li');
            li.className = 'request-item';

            const header = document.createElement('div');

            const method = document.createElement('span');
            method.className = 'request-method';
            method.textContent = request.method;

            const path = document.createElement('span');
            path.className = 'request-path';
            path.textContent = request.path;

            const time = document.createElement('span');
            time.className = 'request-time';
            time.textContent = new Date(request.timestamp).toLocaleString();

            header.appendChild(method);
            header.appendChild(path);
            header.appendChild(document.createTextNode(' '));
            header.appendChild(time);

            const details = document.createElement('div');
            details.className = 'request-details';

            // Headers
            const headersTitle = document.createElement('strong');
            headersTitle.textContent = 'Headers:';
            details.appendChild(headersTitle);

            const headersList = document.createElement('pre');
            headersList.textContent = JSON.stringify(request.headers, null, 2);
            details.appendChild(headersList);

            // Body if present
            if (request.body) {
              const bodyTitle = document.createElement('strong');
              bodyTitle.textContent = 'Body:';
              details.appendChild(bodyTitle);

              const bodyContent = document.createElement('pre');
              bodyContent.textContent = request.body;
              details.appendChild(bodyContent);
            }

            li.appendChild(header);
            li.appendChild(details);
            requestList.appendChild(li);
          });
        }

        // Handle bin created event
        function handleBinCreated(bin) {
          bins.push(bin);
          renderBinList();

          // If this is the first bin, show the bins container
          if (bins.length === 1) {
            binsContainer.classList.remove('hidden');
          }

          // If this is the bin we just created, view it
          if (currentBin && bin.id === currentBin.id) {
            viewBin(bin);
          }
        }

        // Handle request received event
        function handleRequestReceived(bin, request) {
          // Update the bin in our list
          const index = bins.findIndex(b => b.id === bin.id);
          if (index !== -1) {
            bins[index] = bin;
          }

          // If this is the current bin, update the view
          if (currentBin && bin.id === currentBin.id) {
            currentBin = bin;
            renderRequests();
          }
        }

        // Event Listeners
        binForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const name = binNameInput.value.trim();

          try {
            createNotification.textContent = 'Creating bin...';
            createNotification.classList.remove('hidden');

            const bin = await createBin(name);

            createNotification.textContent = 'Bin created successfully!';
            binNameInput.value = '';

            // View the new bin
            currentBin = bin;
            viewBin(bin);

            // Add to bins list if not already there
            if (!bins.some(b => b.id === bin.id)) {
              bins.push(bin);
              renderBinList();
            }
          } catch (error) {
            createNotification.textContent = 'Error creating bin: ' + error.message;
          }
        });

        copyUrlButton.addEventListener('click', () => {
          const url = binUrl.textContent;
          navigator.clipboard.writeText(url)
            .then(() => {
              alert('URL copied to clipboard!');
            })
            .catch(err => {
              console.error('Could not copy URL: ', err);
            });
        });

        backButton.addEventListener('click', () => {
          // Unsubscribe from current bin
          if (currentBin && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'UNSUBSCRIBE', binId: currentBin.id }));
          }

          binView.classList.add('hidden');

          if (bins.length > 0) {
            binsContainer.classList.remove('hidden');
          }

          currentBin = null;
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
          initWebSocket();
        });
      </script>
    </body>
    </html>
  `)
})

// Start the server
const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000
console.log(`Server starting on port ${port}...`)

const server = serve({
  fetch: app.fetch,
  port,
})

// Handle WebSocket upgrade
server.addListener('upgrade', (request: any, socket: any, head: any) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request)
    })
  } else {
    socket.destroy()
  }
})

console.log(`Server running at http://localhost:${port}`)
