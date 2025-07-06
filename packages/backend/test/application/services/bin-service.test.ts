import type { Request } from '../../../src/domain/model/request'
import type { BinRepository } from '../../../src/domain/ports/bin-repository'
import type { NotificationService } from '../../../src/domain/ports/notification-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BinService } from '../../../src/application/services/bin-service'
import { createBin } from '../../../src/domain/model/bin'

// Mock implementations
function createMockBinRepository(): BinRepository {
  return {
    createBin: vi.fn(async name => createBin(name)),
    getBin: vi.fn(async _id => null),
    updateBin: vi.fn(async bin => bin),
    getAllBins: vi.fn(async () => []),
    deleteBin: vi.fn(async () => false),
  }
}

function createMockNotificationService(): NotificationService {
  return {
    notify: vi.fn(async () => {}),
    subscribeToBin: vi.fn(async () => {}),
    unsubscribeFromBin: vi.fn(async () => {}),
  }
}

describe('binService', () => {
  let binRepository: BinRepository
  let notificationService: NotificationService
  let binService: BinService

  beforeEach(() => {
    binRepository = createMockBinRepository()
    notificationService = createMockNotificationService()
    binService = new BinService(binRepository, notificationService)
  })

  describe('createBin', () => {
    it('should create a bin and notify clients', async () => {
      const bin = await binService.createBin('Test Bin')

      expect(binRepository.createBin).toHaveBeenCalledWith('Test Bin')
      expect(notificationService.notify).toHaveBeenCalledWith({
        type: 'BIN_CREATED',
        bin,
      })
      expect(bin.name).toBe('Test Bin')
    })
  })

  describe('getBin', () => {
    it('should return null if bin does not exist', async () => {
      vi.mocked(binRepository.getBin).mockResolvedValue(null)

      const result = await binService.getBin('non-existent')

      expect(binRepository.getBin).toHaveBeenCalledWith('non-existent')
      expect(result).toBeNull()
    })

    it('should return the bin if it exists', async () => {
      const bin = createBin('Test Bin')
      vi.mocked(binRepository.getBin).mockResolvedValue(bin)

      const result = await binService.getBin(bin.id)

      expect(binRepository.getBin).toHaveBeenCalledWith(bin.id)
      expect(result).toBe(bin)
    })
  })

  describe('getAllBins', () => {
    it('should return all bins', async () => {
      const bins = [createBin('Bin 1'), createBin('Bin 2')]
      vi.mocked(binRepository.getAllBins).mockResolvedValue(bins)

      const result = await binService.getAllBins()

      expect(binRepository.getAllBins).toHaveBeenCalled()
      expect(result).toBe(bins)
    })
  })

  describe('deleteBin', () => {
    it('should delete a bin and notify clients if successful', async () => {
      vi.mocked(binRepository.deleteBin).mockResolvedValue(true)

      const result = await binService.deleteBin('bin-id')

      expect(binRepository.deleteBin).toHaveBeenCalledWith('bin-id')
      expect(notificationService.notify).toHaveBeenCalledWith({
        type: 'BIN_DELETED',
        binId: 'bin-id',
      })
      expect(result).toBe(true)
    })

    it('should not notify clients if deletion fails', async () => {
      vi.mocked(binRepository.deleteBin).mockResolvedValue(false)

      const result = await binService.deleteBin('bin-id')

      expect(binRepository.deleteBin).toHaveBeenCalledWith('bin-id')
      expect(notificationService.notify).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('addRequest', () => {
    it('should return null if bin does not exist', async () => {
      vi.mocked(binRepository.getBin).mockResolvedValue(null)

      const requestData: Omit<Request, 'id' | 'timestamp'> = {
        method: 'GET',
        url: 'https://example.com',
        path: '/',
        query: {},
        headers: {},
        body: null,
        ip: '127.0.0.1',
        contentType: null,
      }

      const result = await binService.addRequest('non-existent', requestData)

      expect(binRepository.getBin).toHaveBeenCalledWith('non-existent')
      expect(result).toBeNull()
    })

    it('should add a request to a bin and notify clients', async () => {
      const bin = createBin('Test Bin')
      vi.mocked(binRepository.getBin).mockResolvedValue(bin)

      const requestData: Omit<Request, 'id' | 'timestamp'> = {
        method: 'POST',
        url: 'https://example.com/test',
        path: '/test',
        query: {},
        headers: { 'content-type': 'application/json' },
        body: '{"test":true}',
        ip: '127.0.0.1',
        contentType: 'application/json',
      }

      // Mock the updateBin to return a bin with the request added
      vi.mocked(binRepository.updateBin).mockImplementation(async updatedBin => {
        return updatedBin
      })

      const result = await binService.addRequest(bin.id, requestData)

      expect(binRepository.getBin).toHaveBeenCalledWith(bin.id)
      expect(binRepository.updateBin).toHaveBeenCalled()
      expect(notificationService.notify).toHaveBeenCalledWith({
        type: 'REQUEST_RECEIVED',
        bin: expect.any(Object),
        request: expect.any(Object),
      })

      expect(result).not.toBeNull()
      if (result) {
        expect(result.bin.requests).toHaveLength(1)
        expect(result.request.method).toBe('POST')
        expect(result.request.body).toBe('{"test":true}')
      }
    })
  })
})
