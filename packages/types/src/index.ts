export interface Bin {
  id: string
  name?: string
  createdAt: Date
  requests: Request[]
}

export interface Request {
  id: string
  method: string
  url: string
  path: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string | null
  timestamp: Date
  ip: string
  contentType: string | null
}

export interface NotificationEvent {
  type: 'BIN_CREATED' | 'BIN_DELETED' | 'REQUEST_RECEIVED' | 'BIN_UPDATED' | 'CONNECTED'
  bin?: Bin
  binId?: string
  request?: Request
  clientId?: string
}

export interface NotificationService {
  notify(event: NotificationEvent, clientId?: string): Promise<void>
}
