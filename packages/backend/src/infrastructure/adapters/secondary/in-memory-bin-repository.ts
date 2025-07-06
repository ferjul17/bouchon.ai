import type { Bin } from '../../../domain/model/bin.js'
import type { BinRepository } from '../../../domain/ports/bin-repository.js'
import { createBin } from '../../../domain/model/bin.js'

/**
 * In-memory implementation of BinRepository
 */
export class InMemoryBinRepository implements BinRepository {
  private bins: Map<string, Bin> = new Map()

  /**
   * Creates a new bin
   */
  async createBin(name?: string): Promise<Bin> {
    const bin = createBin(name)
    this.bins.set(bin.id, bin)
    return bin
  }

  /**
   * Gets a bin by ID
   */
  async getBin(id: string): Promise<Bin | null> {
    return this.bins.get(id) || null
  }

  /**
   * Updates a bin
   */
  async updateBin(bin: Bin): Promise<Bin> {
    this.bins.set(bin.id, { ...bin })
    return bin
  }

  /**
   * Gets all bins
   */
  async getAllBins(): Promise<Bin[]> {
    return Array.from(this.bins.values())
  }

  /**
   * Deletes a bin
   */
  async deleteBin(id: string): Promise<boolean> {
    return this.bins.delete(id)
  }
}
