import type { Bin } from '../../../src/domain/model/bin'
import type { Request } from '../../../src/domain/model/request'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addRequestToBin, createBin, getRequestFromBin } from '../../../src/domain/model/bin'

// Mock nanoid to return predictable IDs
vi.mock('nanoid', () => ({
  nanoid: () => 'test-bin-id',
}))

describe('bin Model', () => {
  describe('createBin', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2023-01-01'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should create a bin with the provided name', () => {
      const bin = createBin('Test Bin')

      expect(bin).toEqual({
        id: 'test-bin-id',
        name: 'Test Bin',
        createdAt: new Date('2023-01-01'),
        requests: [],
      })
    })

    it('should create a bin with default name if none provided', () => {
      const bin = createBin()

      expect(bin).toEqual({
        id: 'test-bin-id',
        name: 'New Bin',
        createdAt: new Date('2023-01-01'),
        requests: [],
      })
    })
  })

  describe('addRequestToBin', () => {
    it('should add a request to the bin', () => {
      const bin: Bin = {
        id: 'bin-1',
        name: 'Test Bin',
        createdAt: new Date(),
        requests: [],
      }

      const request: Request = {
        id: 'req-1',
        timestamp: new Date(),
        method: 'GET',
        url: 'https://example.com',
        path: '/',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      }

      const updatedBin = addRequestToBin(bin, request)

      expect(updatedBin.requests).toHaveLength(1)
      expect(updatedBin.requests[0]).toBe(request)
      // Original bin should not be modified (immutability)
      expect(bin.requests).toHaveLength(0)
    })

    it('should add multiple requests to the bin', () => {
      let bin: Bin = {
        id: 'bin-1',
        name: 'Test Bin',
        createdAt: new Date(),
        requests: [],
      }

      const request1: Request = {
        id: 'req-1',
        timestamp: new Date(),
        method: 'GET',
        url: 'https://example.com/1',
        path: '/1',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      }

      const request2: Request = {
        id: 'req-2',
        timestamp: new Date(),
        method: 'POST',
        url: 'https://example.com/2',
        path: '/2',
        query: {},
        headers: {},
        body: '{"test":true}',
        ip: '127.0.0.1',
        contentType: 'application/json',
      }

      bin = addRequestToBin(bin, request1)
      bin = addRequestToBin(bin, request2)

      expect(bin.requests).toHaveLength(2)
      expect(bin.requests[0]).toBe(request1)
      expect(bin.requests[1]).toBe(request2)
    })
  })

  describe('getRequestFromBin', () => {
    it('should return the request with the specified ID', () => {
      const request1: Request = {
        id: 'req-1',
        timestamp: new Date(),
        method: 'GET',
        url: 'https://example.com/1',
        path: '/1',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      }

      const request2: Request = {
        id: 'req-2',
        timestamp: new Date(),
        method: 'POST',
        url: 'https://example.com/2',
        path: '/2',
        query: {},
        headers: {},
        body: '{"test":true}',
        ip: '127.0.0.1',
        contentType: 'application/json',
      }

      const bin: Bin = {
        id: 'bin-1',
        name: 'Test Bin',
        createdAt: new Date(),
        requests: [request1, request2],
      }

      const foundRequest = getRequestFromBin(bin, 'req-2')
      expect(foundRequest).toBe(request2)
    })

    it('should return undefined if the request is not found', () => {
      const bin: Bin = {
        id: 'bin-1',
        name: 'Test Bin',
        createdAt: new Date(),
        requests: [
          {
            id: 'req-1',
            timestamp: new Date(),
            method: 'GET',
            url: 'https://example.com',
            path: '/',
            query: {},
            headers: {},
            body: null,
            ip: '127.0.0.1',
            contentType: null,
          },
        ],
      }

      const foundRequest = getRequestFromBin(bin, 'non-existent')
      expect(foundRequest).toBeUndefined()
    })
  })
})
