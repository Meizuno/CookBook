const DEFAULT_LIMIT = 20

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const query = getQuery(event)
  const tag = query.tag ? String(query.tag) : ''
  const search = query.search ? String(query.search) : ''
  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, 100)
  const offset = Number(query.offset) || 0

  const db = getPrisma()
  const where = {
    ...(search ? {
      OR: [
        { title:   { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}),
    ...(tag ? { tags: { some: { tag: { label: tag } } } } : {})
  }

  const [items, total] = await Promise.all([
    db.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        updated_at: true,
        tags: { select: { tag_id: true } }
      },
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: limit
    }),
    db.recipe.count({ where })
  ])

  return {
    items: items.map(r => ({ ...r, tagIds: r.tags.map(t => t.tag_id), tags: undefined })),
    total,
    hasMore: offset + items.length < total
  }
})
