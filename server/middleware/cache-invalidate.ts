import { promises as fsp } from 'node:fs'

// Sister middleware to `island-cache.ts`. Wipes `.cache/islands/` on any
// successful recipe or tag mutation.
//
// Why coarse (whole-dir rm vs per-file):
//   Island filenames are hashed from their props (`RecipeView__<sha1>.json`),
//   so given just a recipe id from the API path we can't identify which
//   files belong to that recipe without reading each one. Recipe-edit
//   traffic is rare enough that nuking the directory is cheaper than
//   maintaining a sidecar index. The cache repopulates on the next
//   page visit.
//
// Page caching was removed in favour of letting Nitro re-render fresh
// every request — the heavy MDC parse lives inside the cached island,
// so pages stay cheap to render.

const ISLAND_DIR = '.cache/islands'

export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  const path = event.path ?? ''
  const userId = (event.context.user as { id: string } | undefined)?.id
  if (!userId) return  // unauth requests don't trigger invalidation

  if (!path.startsWith('/api/recipes') && !path.startsWith('/api/tags')) return

  event.node.res.on('finish', async () => {
    if (event.node.res.statusCode >= 400) return
    try {
      await fsp.rm(ISLAND_DIR, { recursive: true, force: true })
    }
    catch { /* missing is fine */ }
  })
})
