const DEFAULT_LIMIT = 20

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const query = getQuery(event)
  // Repeated `tags` query keys → recipe must have ALL of them (intersection).
  // `?tags=meat&tags=quick` parses as ['meat', 'quick']; a single `?tags=meat`
  // parses as 'meat', so normalize both shapes.
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

  return {
    items: items.map(r => ({
      id: r.id,
      title: r.title,
      updated_at: r.updated_at,
      tagIds: r.tags.map(t => t.tag_id),
      snippet: makeSnippet(r.content)
    })),
    total,
    hasMore: offset + items.length < total
  }
})
