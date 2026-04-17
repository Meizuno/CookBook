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
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(tag ? { tags: { some: { tag: { label: tag } } } } : {})
  }

  const [items, total] = await Promise.all([
    db.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        updated_at: true,
        tags: { include: { tag: true } }
      },
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: limit
    }),
    db.recipe.count({ where })
  ])

  return {
    items: items.map(r => ({
      ...r,
      content: r.content.length > 150 ? r.content.slice(0, 150) : r.content
    })),
    total,
    hasMore: offset + items.length < total
  }
})
