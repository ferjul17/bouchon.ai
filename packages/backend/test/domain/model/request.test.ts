import type { Request } from '../../../src/domain/model/request'
import { describe, expect, it } from 'vitest'
import { createRequest } from '../../../src/domain/model/request'

describe('request Model', () => {
  describe('createRequest', () => {
    it('should create a request with the provided data', () => {
      const requestData: Omit<Request, 'id' | 'timestamp'> = {
        method: 'GET',
        url: 'https://example.com/test?q=123',
        path: '/test',
        query: { q: '123' },
        headers: { 'content-type': 'application/json' },
        body: null,
        ip: '127.0.0.1',
        contentType: 'application/json',
      }

      const request = createRequest(requestData)

      expect(request).toEqual({
        ...requestData,
        id: expect.any(String),
        timestamp: expect.any(Date),
      })
    })

    it('should generate a unique ID for each request', () => {
      const requestData: Omit<Request, 'id' | 'timestamp'> = {
        method: 'GET',
        url: 'https://example.com/test',
        path: '/test',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      }

      const request1 = createRequest(requestData)
      const request2 = createRequest(requestData)

      expect(request1.id).not.toBe(request2.id)
    })

    it('should set the timestamp to the current time', () => {
      const before = new Date()
      const request = createRequest({
        method: 'GET',
        url: 'https://example.com/test',
        path: '/test',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      })
      const after = new Date()

      expect(request.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(request.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
