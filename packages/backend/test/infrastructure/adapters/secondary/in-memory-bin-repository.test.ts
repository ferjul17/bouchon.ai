import type { Bin } from '../../../../src/domain/model/bin'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryBinRepository } from '../../../../src/infrastructure/adapters/secondary/in-memory-bin-repository'

describe('inMemoryBinRepository', () => {
  let repository: InMemoryBinRepository

  beforeEach(() => {
    repository = new InMemoryBinRepository()
  })

  describe('createBin', () => {
    it('should create a bin with the provided name', async () => {
      const bin = await repository.createBin('Test Bin')

      expect(bin.name).toBe('Test Bin')
      expect(bin.id).toBeTruthy()
      expect(bin.requests).toEqual([])
    })

    it('should create a bin with default name if none provided', async () => {
      const bin = await repository.createBin()

      expect(bin.name).toBe('New Bin')
      expect(bin.id).toBeTruthy()
      expect(bin.requests).toEqual([])
    })
  })

  describe('getBin', () => {
    it('should return null if bin does not exist', async () => {
      const bin = await repository.getBin('non-existent')

      expect(bin).toBeNull()
    })

    it('should return the bin if it exists', async () => {
      const createdBin = await repository.createBin('Test Bin')
      const retrievedBin = await repository.getBin(createdBin.id)

      expect(retrievedBin).not.toBeNull()
      expect(retrievedBin?.id).toBe(createdBin.id)
      expect(retrievedBin?.name).toBe('Test Bin')
    })
  })

  describe('updateBin', () => {
    it('should update an existing bin', async () => {
      const bin = await repository.createBin('Original Name')

      const updatedBin: Bin = {
        ...bin,
        name: 'Updated Name',
      }

      const result = await repository.updateBin(updatedBin)
      const retrievedBin = await repository.getBin(bin.id)

      expect(result).toEqual(updatedBin)
      expect(retrievedBin?.name).toBe('Updated Name')
    })

    it('should create a deep copy of the bin to prevent unintended mutations', async () => {
      const bin = await repository.createBin('Test Bin')

      const updatedBin = await repository.updateBin(bin)

      // Modify the returned bin
      updatedBin.name = 'Modified After Update'

      // The stored bin should not be affected
      const retrievedBin = await repository.getBin(bin.id)
      expect(retrievedBin?.name).toBe('Test Bin')
    })
  })

  describe('getAllBins', () => {
    it('should return an empty array if no bins exist', async () => {
      const bins = await repository.getAllBins()

      expect(bins).toEqual([])
    })

    it('should return all bins', async () => {
      await repository.createBin('Bin 1')
      await repository.createBin('Bin 2')
      await repository.createBin('Bin 3')

      const bins = await repository.getAllBins()

      expect(bins).toHaveLength(3)
      expect(bins.map(bin => bin.name)).toEqual(['Bin 1', 'Bin 2', 'Bin 3'])
    })
  })

  describe('deleteBin', () => {
    it('should return false if bin does not exist', async () => {
      const result = await repository.deleteBin('non-existent')

      expect(result).toBe(false)
    })

    it('should delete the bin and return true if it exists', async () => {
      const bin = await repository.createBin('Test Bin')

      const result = await repository.deleteBin(bin.id)
      const retrievedBin = await repository.getBin(bin.id)

      expect(result).toBe(true)
      expect(retrievedBin).toBeNull()
    })
  })
})
