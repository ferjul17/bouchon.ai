import type { WebSocket } from 'ws'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocketServer } from 'ws'
import { createBin } from '../../../../../src/domain/model/bin'
import { createRequest } from '../../../../../src/domain/model/request'
import { WebSocketNotificationService } from '../../../../../src/infrastructure/adapters/primary/websocket/websocket-notification-service'

// Mock WebSocketServer and WebSocket
vi.mock('ws', () => {
  const MockWebSocket = vi.fn(() => ({
    send: vi.fn(),
    on: vi.fn(),
    readyState: 1, // OPEN
  }))

  const MockWebSocketServer = vi.fn(() => ({
    on: vi.fn(),
    handleUpgrade: vi.fn(),
    emit: vi.fn(),
  }))

  // @ts-expect-error - Mocking static properties
  MockWebSocket.OPEN = 1

  return {
    WebSocket: MockWebSocket,
    WebSocketServer: MockWebSocketServer,
  }
})

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-client-id',
}))

describe('webSocketNotificationService', () => {
  let wss: WebSocketServer
  let service: WebSocketNotificationService
  let mockSocket: WebSocket
  let connectionHandler: (socket: WebSocket) => void

  beforeEach(() => {
    // Create mock WebSocketServer
    wss = new WebSocketServer()

    // Capture the connection handler when it's registered
    vi.mocked(wss.on).mockImplementation((event, handler) => {
      if (event === 'connection') {
        connectionHandler = handler as (socket: WebSocket) => void
      }
      return wss
    })

    // Create the service
    service = new WebSocketNotificationService(wss)

    // Create a mock socket
    mockSocket = {
      send: vi.fn(),
      on: vi.fn(),
      readyState: 1, // OPEN
    } as unknown as WebSocket

    // Simulate a connection
    if (connectionHandler) {
      connectionHandler(mockSocket)
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('setupWebSocketServer', () => {
    it('should set up connection handler', () => {
      expect(wss.on).toHaveBeenCalledWith('connection', expect.any(Function))
    })

    it('should send client ID on connection', () => {
      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'CONNECTED', clientId: 'test-client-id' }),
      )
    })

    it('should set up message and close handlers', () => {
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('close', expect.any(Function))
    })
  })

  describe('notify', () => {
    it('should notify a specific client', async () => {
      const bin = createBin('Test Bin')
      const event = { type: 'BIN_CREATED', bin }

      await service.notify(event, 'test-client-id')

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(event))
    })

    it('should notify subscribers when a request is received', async () => {
      const bin = createBin('Test Bin')
      const request = createRequest({
        method: 'GET',
        url: 'https://example.com',
        path: '/',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      })

      const event = { type: 'REQUEST_RECEIVED', bin, request }

      // Subscribe the client to the bin
      await service.subscribeToBin(bin.id, 'test-client-id')

      // Notify about the event
      await service.notify(event)

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(event))
    })

    it('should broadcast to all clients for non-bin-specific events', async () => {
      const event = { type: 'BIN_DELETED', binId: 'bin-id' }

      await service.notify(event)

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(event))
    })
  })

  describe('subscribeToBin and unsubscribeFromBin', () => {
    it('should subscribe a client to a bin', async () => {
      await service.subscribeToBin('bin-id', 'test-client-id')

      // Create an event for the bin
      const bin = { id: 'bin-id', name: 'Test Bin', createdAt: new Date(), requests: [] }
      const event = { type: 'BIN_UPDATED', bin }

      // Notify about the event
      await service.notify(event)

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(event))
    })

    it('should unsubscribe a client from a bin', async () => {
      // First subscribe
      await service.subscribeToBin('bin-id', 'test-client-id')

      // Then unsubscribe
      await service.unsubscribeFromBin('bin-id', 'test-client-id')

      // Reset the mock to clear previous calls
      vi.mocked(mockSocket.send).mockClear()

      // Create an event for the bin
      const bin = { id: 'bin-id', name: 'Test Bin', createdAt: new Date(), requests: [] }
      const event = { type: 'BIN_UPDATED', bin }

      // Notify about the event
      await service.notify(event)

      // The client should not be notified
      expect(mockSocket.send).not.toHaveBeenCalled()
    })
  })

  describe('message handling', () => {
    it('should handle SUBSCRIBE messages', () => {
      // Capture the message handler
      let messageHandler: (message: string) => void
      vi.mocked(mockSocket.on).mockImplementation((event, handler) => {
        if (event === 'message') {
          messageHandler = handler as (message: string) => void
        }
        return mockSocket
      })

      // Simulate a connection to capture the handler
      connectionHandler(mockSocket)

      // Simulate a SUBSCRIBE message
      messageHandler(JSON.stringify({ type: 'SUBSCRIBE', binId: 'bin-id' }))

      // Create an event for the bin
      const bin = { id: 'bin-id', name: 'Test Bin', createdAt: new Date(), requests: [] }
      const event = { type: 'BIN_UPDATED', bin }

      // Notify about the event
      service.notify(event)

      expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('BIN_UPDATED'))
    })

    it('should handle UNSUBSCRIBE messages', () => {
      // Capture the message handler
      let messageHandler: (message: string) => void
      vi.mocked(mockSocket.on).mockImplementation((event, handler) => {
        if (event === 'message') {
          messageHandler = handler as (message: string) => void
        }
        return mockSocket
      })

      // Simulate a connection to capture the handler
      connectionHandler(mockSocket)

      // Simulate a SUBSCRIBE message
      messageHandler(JSON.stringify({ type: 'SUBSCRIBE', binId: 'bin-id' }))

      // Reset the mock to clear previous calls
      vi.mocked(mockSocket.send).mockClear()

      // Simulate an UNSUBSCRIBE message
      messageHandler(JSON.stringify({ type: 'UNSUBSCRIBE', binId: 'bin-id' }))

      // Create an event for the bin
      const bin = { id: 'bin-id', name: 'Test Bin', createdAt: new Date(), requests: [] }
      const event = { type: 'BIN_UPDATED', bin }

      // Notify about the event
      service.notify(event)

      // The client should not be notified
      expect(mockSocket.send).not.toHaveBeenCalled()
    })
  })

  describe('client disconnection', () => {
    it('should clean up when a client disconnects', () => {
      // Capture the close handler
      let closeHandler: () => void
      vi.mocked(mockSocket.on).mockImplementation((event, handler) => {
        if (event === 'close') {
          closeHandler = handler as () => void
        }
        return mockSocket
      })

      // Simulate a connection to capture the handler
      connectionHandler(mockSocket)

      // Subscribe to a bin
      service.subscribeToBin('bin-id', 'test-client-id')

      // Simulate disconnection
      closeHandler()

      // Reset the mock to clear previous calls
      vi.mocked(mockSocket.send).mockClear()

      // Create an event for the bin
      const bin = { id: 'bin-id', name: 'Test Bin', createdAt: new Date(), requests: [] }
      const event = { type: 'BIN_UPDATED', bin }

      // Notify about the event
      service.notify(event)

      // The client should not be notified
      expect(mockSocket.send).not.toHaveBeenCalled()
    })
  })
})
