import type { Bin } from '../model/bin.js'
import type { Request } from '../model/request.js'

/**
 * Events that can be sent to clients
 */
export type NotificationEvent
  = | { type: 'BIN_CREATED'; bin: Bin }
    | { type: 'BIN_UPDATED'; bin: Bin }
    | { type: 'BIN_DELETED'; binId: string }
    | { type: 'REQUEST_RECEIVED'; bin: Bin; request: Request }

/**
 * Port for sending real-time notifications to clients
 */
export interface NotificationService {
  /**
   * Notifies all clients or specific clients about an event
   */
  notify: (event: NotificationEvent, clientId?: string) => Promise<void>

  /**
   * Registers a client for notifications about a specific bin
   */
  subscribeToBin: (binId: string, clientId: string) => Promise<void>

  /**
   * Unregisters a client from notifications about a specific bin
   */
  unsubscribeFromBin: (binId: string, clientId: string) => Promise<void>
}
