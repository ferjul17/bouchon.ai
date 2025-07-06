import type { Bin, Request } from '@test-ai/types'
import type { BinRepository } from '../../domain/ports/bin-repository.js'
import type { NotificationService } from '../../domain/ports/notification-service.js'
import { addRequestToBin } from '../../domain/model/bin.js'
import { createRequest } from '../../domain/model/request.js'

/**
 * Service for managing bins and requests
 */
export class BinService {
  constructor(
    private readonly binRepository: BinRepository,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Creates a new bin
   */
  async createBin(name?: string): Promise<Bin> {
    const bin = await this.binRepository.createBin(name)
    await this.notificationService.notify({ type: 'BIN_CREATED', bin })
    return bin
  }

  /**
   * Gets a bin by ID
   */
  async getBin(id: string): Promise<Bin | null> {
    return this.binRepository.getBin(id)
  }

  /**
   * Gets all bins
   */
  async getAllBins(): Promise<Bin[]> {
    return this.binRepository.getAllBins()
  }

  /**
   * Deletes a bin
   */
  async deleteBin(id: string): Promise<boolean> {
    const deleted = await this.binRepository.deleteBin(id)
    if (deleted) {
      await this.notificationService.notify({ type: 'BIN_DELETED', binId: id })
    }
    return deleted
  }

  /**
   * Adds a request to a bin
   */
  async addRequest(
    binId: string,
    requestData: Omit<Request, 'id' | 'timestamp'>
  ): Promise<{ bin: Bin; request: Request } | null> {
    const bin = await this.binRepository.getBin(binId)
    if (!bin) return null

    const request = createRequest(requestData)
    const updatedBin = addRequestToBin(bin, request)

    const savedBin = await this.binRepository.updateBin(updatedBin)
    await this.notificationService.notify({
      type: 'REQUEST_RECEIVED',
      bin: savedBin,
      request,
    })

    return { bin: savedBin, request }
  }
}
