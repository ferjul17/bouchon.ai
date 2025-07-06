import type { NotificationEvent, NotificationService } from '@test-ai/types'
import type { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'
import { WebSocket } from 'ws'

interface Client {
  id: string
  socket: WebSocket
  subscriptions: Set<string>
}

/**
 * WebSocket implementation of NotificationService
 */
export class WebSocketNotificationService implements NotificationService {
  private clients: Map<string, Client> = new Map()
  private binSubscriptions: Map<string, Set<string>> = new Map()

  constructor(private readonly wss: WebSocketServer) {
    this.setupWebSocketServer()
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (socket: WebSocket) => {
      const clientId = randomUUID()

      // Create client
      this.clients.set(clientId, {
        id: clientId,
        socket,
        subscriptions: new Set(),
      })

      // Send client ID to the client
      socket.send(JSON.stringify({ type: 'CONNECTED', clientId }))

      // Handle messages from client
      socket.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString())

          if (data.type === 'SUBSCRIBE' && data.binId) {
            this.subscribeToBin(data.binId, clientId).catch(console.error)
          } else if (data.type === 'UNSUBSCRIBE' && data.binId) {
            this.unsubscribeFromBin(data.binId, clientId).catch(console.error)
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
        }
      })

      // Handle disconnection
      socket.on('close', () => {
        const client = this.clients.get(clientId)
        if (client) {
          // Remove client from all bin subscriptions
          for (const binId of client.subscriptions) {
            const subscribers = this.binSubscriptions.get(binId)
            if (subscribers) {
              subscribers.delete(clientId)
              if (subscribers.size === 0) {
                this.binSubscriptions.delete(binId)
              }
            }
          }

          // Remove client
          this.clients.delete(clientId)
        }
      })
    })
  }

  /**
   * Notifies all clients or specific clients about an event
   */
  async notify(event: NotificationEvent, clientId?: string): Promise<void> {
    const message = JSON.stringify(event)

    if (clientId) {
      // Notify specific client
      const client = this.clients.get(clientId)
      if (client && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message)
      }
    } else if (event.type === 'REQUEST_RECEIVED' || event.type === 'BIN_UPDATED') {
      // Notify subscribers of the bin
      if (event.bin) {
        const binId = event.bin.id
        const subscribers = this.binSubscriptions.get(binId) || new Set()

        for (const subscriberId of subscribers) {
          const client = this.clients.get(subscriberId)
          if (client && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(message)
          }
        }
      }
    } else {
      // Broadcast to all clients
      for (const client of this.clients.values()) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(message)
        }
      }
    }
  }

  /**
   * Registers a client for notifications about a specific bin
   */
  async subscribeToBin(binId: string, clientId: string): Promise<void> {
    // Add bin to client subscriptions
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.add(binId)
    }

    // Add client to bin subscribers
    let subscribers = this.binSubscriptions.get(binId)
    if (!subscribers) {
      subscribers = new Set()
      this.binSubscriptions.set(binId, subscribers)
    }
    subscribers.add(clientId)
  }

  /**
   * Unregisters a client from notifications about a specific bin
   */
  async unsubscribeFromBin(binId: string, clientId: string): Promise<void> {
    // Remove bin from client subscriptions
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.delete(binId)
    }

    // Remove client from bin subscribers
    const subscribers = this.binSubscriptions.get(binId)
    if (subscribers) {
      subscribers.delete(clientId)
      if (subscribers.size === 0) {
        this.binSubscriptions.delete(binId)
      }
    }
  }
}
