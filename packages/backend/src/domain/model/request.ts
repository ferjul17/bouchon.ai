/**
 * Represents an HTTP request captured by the system
 */
export interface Request {
  id: string
  timestamp: Date
  method: string
  url: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  body: string | null
  ip: string
  contentType: string | null
}

/**
 * Factory function to create a new Request
 */
export function createRequest(params: Omit<Request, 'id' | 'timestamp'>): Request {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...params,
  }
}
