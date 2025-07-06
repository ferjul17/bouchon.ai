import type { Bin } from '../model/bin.js'

/**
 * Port for storing and retrieving bins
 */
export interface BinRepository {
  /**
   * Creates a new bin
   */
  createBin: (name?: string) => Promise<Bin>

  /**
   * Gets a bin by ID
   */
  getBin: (id: string) => Promise<Bin | null>

  /**
   * Updates a bin
   */
  updateBin: (bin: Bin) => Promise<Bin>

  /**
   * Gets all bins
   */
  getAllBins: () => Promise<Bin[]>

  /**
   * Deletes a bin
   */
  deleteBin: (id: string) => Promise<boolean>
}
