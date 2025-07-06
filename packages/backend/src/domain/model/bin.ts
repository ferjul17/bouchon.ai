import type { Request } from '@test-ai/types'
import { nanoid } from 'nanoid'

/**
 * Represents a collection of HTTP requests with a unique identifier
 */
export interface Bin {
  id: string
  name: string
  createdAt: Date
  requests: Request[]
}

/**
 * Factory function to create a new Bin
 */
export function createBin(name: string = 'New Bin'): Bin {
  return {
    id: nanoid(10), // Generate a short, URL-friendly ID
    name,
    createdAt: new Date(),
    requests: [],
  }
}

/**
 * Adds a request to a bin
 */
export function addRequestToBin(bin: Bin, request: Request): Bin {
  return {
    ...bin,
    requests: [...bin.requests, request],
  }
}

/**
 * Gets a request from a bin by ID
 */
export function getRequestFromBin(bin: Bin, requestId: string): Request | undefined {
  return bin.requests.find(request => request.id === requestId)
}
