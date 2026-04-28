import { existsSync, promises as fsp } from 'node:fs'
import { join } from 'node:path'

// Read side of the home-page cache. Cache misses fall through to the
// renderer; the write side lives in `server/plugins/page-cache.ts`
// (Nitro `beforeResponse` hook).
//
// We only cache the bare `/` with no query string. Filtered renders
// (`?search=…`, `?tags=…`) bypass the cache entirely — caching every
// query combo would blow up the file count and serving a generic
// cache entry under a filtered URL would lie to the user.
//
// Disk layout (flat):
//   .cache/pages/home__<userId>.html
//
// User-scoped because the rendered HTML embeds the auth header (name,
// avatar, dropdown). Two users → two files; coarse-wiped on any
// recipe / tag mutation by `cache-invalidate.ts`.

const PAGE_DIR = '.cache/pages'

export function homeFilePath(userId: string): string {
  return join(PAGE_DIR, `home__${userId}.html`)
}

function isCacheableHome(path: string, query: string): boolean {
  return (path === '/' || path === '') && !query
}

export default defineEventHandler(async (event) => {
  if (import.meta.dev) return
  if (event.method !== 'GET') return

  const fullPath = event.path ?? ''
  const [path, query = ''] = fullPath.split('?')
  if (!isCacheableHome(path, query)) return

  const userId = (event.context.user as { id: string } | undefined)?.id
  if (!userId) return

  const filePath = homeFilePath(userId)
  if (!existsSync(filePath)) return  // miss → fall through; plugin writes after handler

  try {
    const data = await fsp.readFile(filePath, 'utf-8')
    event.node.res.setHeader('content-type', 'text/html; charset=utf-8')
    event.node.res.setHeader('x-cache', 'HIT')
    event.node.res.end(data)
  }
  catch { /* fall through and re-render */ }
})
