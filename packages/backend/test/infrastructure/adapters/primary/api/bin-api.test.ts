import type { BinService } from '../../../../../src/application/services/bin-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBin } from '../../../../../src/domain/model/bin'
import { createRequest } from '../../../../../src/domain/model/request'
import { createBinApi } from '../../../../../src/infrastructure/adapters/primary/api/bin-api'

// Mock BinService
function createMockBinService(): BinService {
  return {
    createBin: vi.fn(async name => createBin(name)),
    getBin: vi.fn(async () => null),
    getAllBins: vi.fn(async () => []),
    deleteBin: vi.fn(async () => false),
    addRequest: vi.fn(async () => null),
  }
}

describe('bin API', () => {
  let binService: BinService
  let app: ReturnType<typeof createBinApi>

  beforeEach(() => {
    binService = createMockBinService()
    app = createBinApi(binService)
  })

  describe('gET /api/bins', () => {
    it('should return all bins', async () => {
      const bins = [createBin('Bin 1'), createBin('Bin 2')]
      vi.mocked(binService.getAllBins).mockResolvedValue(bins)

      const res = await app.request('/api/bins')
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.bins).toHaveLength(bins.length)
      expect(body.bins[0].id).toEqual(bins[0].id)
      expect(body.bins[0].name).toEqual(bins[0].name)
      expect(body.bins[1].id).toEqual(bins[1].id)
      expect(body.bins[1].name).toEqual(bins[1].name)
      expect(binService.getAllBins).toHaveBeenCalled()
    })
  })

  describe('pOST /api/bins', () => {
    it('should create a new bin with the provided name', async () => {
      const bin = createBin('Test Bin')
      vi.mocked(binService.createBin).mockResolvedValue(bin)

      const res = await app.request('/api/bins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test Bin' }),
      })
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.bin.id).toEqual(bin.id)
      expect(body.bin.name).toEqual(bin.name)
      expect(body.bin.requests).toEqual(bin.requests)
      expect(binService.createBin).toHaveBeenCalledWith('Test Bin')
    })

    it('should create a new bin with default name if none provided', async () => {
      const bin = createBin()
      vi.mocked(binService.createBin).mockResolvedValue(bin)

      const res = await app.request('/api/bins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.bin.id).toEqual(bin.id)
      expect(body.bin.name).toEqual(bin.name)
      expect(body.bin.requests).toEqual(bin.requests)
      expect(binService.createBin).toHaveBeenCalledWith(undefined)
    })

    it('should handle invalid JSON', async () => {
      const bin = createBin()
      vi.mocked(binService.createBin).mockResolvedValue(bin)

      const res = await app.request('/api/bins', {
        method: 'POST',
      })
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.bin.id).toEqual(bin.id)
      expect(body.bin.name).toEqual(bin.name)
      expect(body.bin.requests).toEqual(bin.requests)
      expect(binService.createBin).toHaveBeenCalledWith(undefined)
    })
  })

  describe('gET /api/bins/:id', () => {
    it('should return a bin if it exists', async () => {
      const bin = createBin('Test Bin')
      vi.mocked(binService.getBin).mockResolvedValue(bin)

      const res = await app.request(`/api/bins/${bin.id}`)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.bin.id).toEqual(bin.id)
      expect(body.bin.name).toEqual(bin.name)
      expect(body.bin.requests).toEqual(bin.requests)
      expect(binService.getBin).toHaveBeenCalledWith(bin.id)
    })

    it('should return 404 if bin does not exist', async () => {
      vi.mocked(binService.getBin).mockResolvedValue(null)

      const res = await app.request('/api/bins/non-existent')
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body).toEqual({ error: 'Bin not found' })
      expect(binService.getBin).toHaveBeenCalledWith('non-existent')
    })
  })

  describe('dELETE /api/bins/:id', () => {
    it('should delete a bin if it exists', async () => {
      vi.mocked(binService.deleteBin).mockResolvedValue(true)

      const res = await app.request('/api/bins/bin-id', {
        method: 'DELETE',
      })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ success: true })
      expect(binService.deleteBin).toHaveBeenCalledWith('bin-id')
    })

    it('should return 404 if bin does not exist', async () => {
      vi.mocked(binService.deleteBin).mockResolvedValue(false)

      const res = await app.request('/api/bins/non-existent', {
        method: 'DELETE',
      })
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body).toEqual({ error: 'Bin not found' })
      expect(binService.deleteBin).toHaveBeenCalledWith('non-existent')
    })
  })

  describe('aLL /b/:id/*', () => {
    it('should capture a request and add it to the bin', async () => {
      const bin = createBin('Test Bin')
      const request = createRequest({
        method: 'POST',
        url: 'https://example.com/b/bin-id/test',
        path: '/b/bin-id/test',
        query: { q: 'test' },
        headers: { 'content-type': 'application/json' },
        body: '{"test":true}',
        ip: '127.0.0.1',
        contentType: 'application/json',
      })

      vi.mocked(binService.getBin).mockResolvedValue(bin)
      vi.mocked(binService.addRequest).mockResolvedValue({ bin, request })

      const res = await app.request('/b/bin-id/test?q=test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({ test: true }),
      })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({
        success: true,
        message: 'Request captured',
        binId: 'bin-id',
      })
      expect(binService.getBin).toHaveBeenCalledWith('bin-id')
      expect(binService.addRequest).toHaveBeenCalledWith(
        'bin-id',
        expect.objectContaining({
          method: 'POST',
          path: expect.stringContaining('/test'),
          query: expect.objectContaining({ q: 'test' }),
          headers: expect.any(Object),
          body: expect.any(String),
          ip: '127.0.0.1',
          contentType: 'application/json',
        })
      )
    })

    it('should return 404 if bin does not exist', async () => {
      vi.mocked(binService.getBin).mockResolvedValue(null)

      const res = await app.request('/b/non-existent/test')
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body).toEqual({ error: 'Bin not found' })
      expect(binService.getBin).toHaveBeenCalledWith('non-existent')
      expect(binService.addRequest).not.toHaveBeenCalled()
    })

    it('should handle GET requests without a body', async () => {
      const bin = createBin('Test Bin')
      vi.mocked(binService.getBin).mockResolvedValue(bin)

      const res = await app.request('/b/bin-id/test?q=test')
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({
        success: true,
        message: 'Request captured',
        binId: 'bin-id',
      })
      expect(binService.getBin).toHaveBeenCalledWith('bin-id')
      expect(binService.addRequest).toHaveBeenCalledWith(
        'bin-id',
        expect.objectContaining({
          method: 'GET',
          path: expect.stringContaining('/test'),
          query: expect.objectContaining({ q: 'test' }),
          body: null,
        })
      )
    })
  })
})
