import type { Request as DomainRequest } from '@test-ai/types'
import type { BinService } from '../../../../application/services/bin-service.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

/**
 * API for managing bins and capturing requests
 */
export function createBinApi(binService: BinService): Hono {
  const app = new Hono()

  // Middleware
  app.use('*', logger())
  app.use('*', cors())

  // API routes
  const api = app.basePath('/api')

  // Get all bins
  api.get('/bins', async c => {
    const bins = await binService.getAllBins()
    return c.json({ bins })
  })

  // Create a new bin
  api.post('/bins', async c => {
    const data = await c.req.json<{ name?: string }>().catch(() => ({}))
    // Use optional chaining to safely access name property
    const name = 'name' in data ? data.name : undefined
    const bin = await binService.createBin(name)
    return c.json({ bin }, 201)
  })

  // Get a bin by ID
  api.get('/bins/:id', async c => {
    const id = c.req.param('id')
    const bin = await binService.getBin(id)

    if (!bin) {
      return c.json({ error: 'Bin not found' }, 404)
    }

    return c.json({ bin })
  })

  // Delete a bin
  api.delete('/bins/:id', async c => {
    const id = c.req.param('id')
    const deleted = await binService.deleteBin(id)

    if (!deleted) {
      return c.json({ error: 'Bin not found' }, 404)
    }

    return c.json({ success: true })
  })

  // Capture requests to bins
  app.all('/b/:id/*', async c => {
    const binId = c.req.param('id')
    const bin = await binService.getBin(binId)

    if (!bin) {
      return c.json({ error: 'Bin not found' }, 404)
    }

    // Parse request details
    const url = new URL(c.req.url)
    const headers: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get request body
    let body: string | null = null
    const contentType = c.req.header('content-type')

    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      try {
        body = await c.req.text()
      } catch (error) {
        console.error('Error reading request body:', error)
      }
    }

    // Create query params object
    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })

    // Create request object
    const requestData: Omit<DomainRequest, 'id' | 'timestamp'> = {
      method: c.req.method,
      url: c.req.url,
      path: url.pathname,
      query,
      headers,
      body,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      contentType: contentType || null,
    }

    // Add request to bin
    await binService.addRequest(binId, requestData)

    // Return a simple acknowledgment
    return c.json({
      success: true,
      message: 'Request captured',
      binId,
    })
  })

  return app
}
