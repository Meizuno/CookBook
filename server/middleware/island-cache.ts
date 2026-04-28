import { existsSync, promises as fsp } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

// Read side of the island cache. Cache misses fall through to the
// renderer; the write side lives in `server/plugins/island-cache.ts`
// (Nitro `beforeResponse` hook), which is the only reliable way to
// capture the response body under modern h3.
//
// Disk layout (flat):
//   .cache/islands/RecipeView__<8charSha1OfProps>.json
//
// Cache key = SHA1(props query). `RecipeView :id="7" :v="3"` has a
// different hash than `:v="4"`, so an edit (which bumps the version
// counter) naturally invalidates the cached fragment by going to a
// new key — though we also wipe the dir on mutations via
// `cache-invalidate.ts` to keep things clean.

const ISLAND_DIR = '.cache/islands'

const isIslandPath = (p: string) => p.startsWith('/__nuxt_island/')

export function islandFilePath(path: string): string {
  // path = '/__nuxt_island/RecipeView.json?props={"id":7,"v":0}'
  const [route, query = ''] = path.split('?')
  const name = route.slice('/__nuxt_island/'.length).replace(/\.json$/, '')
  const hash = createHash('sha1').update(query).digest('hex').slice(0, 8)
  return join(ISLAND_DIR, `${name}__${hash}.json`)
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') return
  const path = event.path ?? ''
  if (!isIslandPath(path)) return

  const userId = (event.context.user as { id: string } | undefined)?.id
  if (!userId) return

  const filePath = islandFilePath(path)
  if (!existsSync(filePath)) return  // miss → fall through; plugin writes after handler

  try {
    const data = await fsp.readFile(filePath, 'utf-8')
    event.node.res.setHeader('content-type', 'application/json; charset=utf-8')
    event.node.res.setHeader('x-cache', 'HIT')
    event.node.res.end(data)
  }
  catch { /* fall through and re-render */ }
})
