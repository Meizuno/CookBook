// Streaming endpoint for the home-page recipe list. Emits NDJSON:
//
//   {"meta":{"total":N,"hasMore":boolean}}\n
//   {"item":{...recipe}}\n
//   {"item":{...recipe}}\n
//   ...
//
// Meta arrives first so the client can clear loading state and sync
// pagination flags before recipe cards begin rendering. Items follow
// in display order (newest updated first). Pagination params (limit,
// offset, search, tags) are unchanged from the previous JSON shape.

const DEFAULT_LIMIT = 20

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const query = getQuery(event)
  // Repeated `tags` query keys → recipe must have ALL of them (intersection).
  const rawTags = query.tags
  const tags = (Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [])
    .map(s => String(s).trim()).filter(Boolean)
  const search = query.search ? String(query.search) : ''
  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, 100)
  const offset = Number(query.offset) || 0

  const db = getPrisma()
  const where = {
    is_deleted: false,
    ...(search ? {
      OR: [
        { title:   { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}),
    ...(tags.length ? { AND: tags.map(t => ({ tags: { some: { tag: { label: t } } } })) } : {})
  }

  const [items, total] = await Promise.all([
    db.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        updated_at: true,
        tags: { select: { tag_id: true } }
      },
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: limit
    }),
    db.recipe.count({ where })
  ])

  const makeSnippet = (content: string) => {
    if (!content) return null
    if (search) {
      const idx = content.toLowerCase().indexOf(search.toLowerCase())
      if (idx >= 0) {
        const start = Math.max(0, idx - 40)
        const end = Math.min(content.length, idx + search.length + 40)
        return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
      }
    }
    return content.slice(0, 120).trim() + (content.length > 120 ? '…' : '')
  }

  setHeader(event, 'content-type', 'application/x-ndjson; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')
  setHeader(event, 'x-accel-buffering', 'no')

  const enc = new TextEncoder()
  const meta = { total, hasMore: offset + items.length < total }

  // Deliberate per-item pacing so the client sees a visible cascade
  // rather than 20 cards landing in the same frame. ~30ms is below the
  // "feels slow" threshold but above "all at once".
  const ITEM_INTERVAL_MS = 30

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode(JSON.stringify({ meta }) + '\n'))
      await new Promise(r => setImmediate(r))
      for (const r of items) {
        const item = {
          id: r.id,
          title: r.title,
          updated_at: r.updated_at,
          tagIds: r.tags.map(t => t.tag_id),
          snippet: makeSnippet(r.content)
        }
        controller.enqueue(enc.encode(JSON.stringify({ item }) + '\n'))
        await new Promise(r => setTimeout(r, ITEM_INTERVAL_MS))
      }
      controller.close()
    }
  })
})
