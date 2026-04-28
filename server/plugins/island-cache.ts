import { existsSync, promises as fsp } from 'node:fs'
import { dirname } from 'node:path'
import { islandFilePath } from '../middleware/island-cache'

// Write side of the island cache. Nitro's `beforeResponse` hook fires
// after the handler returns with `response.body` populated, which is
// the only reliable way to capture the rendered island JSON under h3
// v2 — patching `event.node.res.write/end` from middleware no longer
// works because h3 sends responses through paths that bypass those
// legacy Node-stream methods.
//
// On a cache miss the read-side middleware lets the renderer run; we
// persist the rendered body here. On a cache hit the middleware
// already sent the file via `res.end`, so `existsSync` short-circuits.

const isIslandPath = (p: string) => p.startsWith('/__nuxt_island/')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', async (event, response) => {
    if (event.method !== 'GET') return
    const path = event.path ?? ''
    if (!isIslandPath(path)) return
    const userId = (event.context.user as { id: string } | undefined)?.id
    if (!userId) return
    if (event.node.res.statusCode !== 200) return

    const filePath = islandFilePath(path)
    if (existsSync(filePath)) return

    const raw = response.body
    const body = typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object'
        ? JSON.stringify(raw)
        : null
    if (!body) return

    try {
      await fsp.mkdir(dirname(filePath), { recursive: true })
      await fsp.writeFile(filePath, body, 'utf-8')
    }
    catch (err) {
      console.error('[island-cache] write failed:', (err as Error).message)
    }
  })
})
