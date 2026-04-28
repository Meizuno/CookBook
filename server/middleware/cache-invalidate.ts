import { promises as fsp } from 'node:fs'

// Sister middleware to the disk caches. Wipes `.cache/islands/` and
// `.cache/pages/` on any successful recipe or tag mutation.
//
// Why coarse (whole-dir rm vs per-file):
//   Island filenames are hashed from their props (`RecipeView__<sha1>.json`),
//   so given just a recipe id from the API path we can't identify which
//   files belong to that recipe without reading each one. The home
//   page cache is per-user; one user's edit invalidates every user's
//   view of the recipe list. Recipe-edit traffic is rare enough that
//   nuking the directories is cheaper than maintaining sidecar indexes.

const ISLAND_DIR = '.cache/islands'
const PAGE_DIR = '.cache/pages'

export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  const path = event.path ?? ''
  const userId = (event.context.user as { id: string } | undefined)?.id
  if (!userId) return  // unauth requests don't trigger invalidation

  if (!path.startsWith('/api/recipes') && !path.startsWith('/api/tags')) return

  event.node.res.on('finish', async () => {
    if (event.node.res.statusCode >= 400) return
    await Promise.all([
      fsp.rm(ISLAND_DIR, { recursive: true, force: true }).catch(() => {}),
      fsp.rm(PAGE_DIR, { recursive: true, force: true }).catch(() => {})
    ])
  })
})
