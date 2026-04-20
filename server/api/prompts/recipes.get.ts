export default defineEventHandler(async (event) => {
  verifyPromptAccess(event)
  const db = getPrisma()

  const query = getQuery(event)
  const recipeId = query.id ? parseInt(query.id as string) : null
  const tag = query.tag ? String(query.tag) : ''
  const search = query.search ? String(query.search) : ''
  const limit = Math.min(Number(query.limit) || 10, 100)
  const offset = Number(query.offset) || 0

  // Single recipe detail
  if (recipeId) {
    const recipe = await db.recipe.findFirst({
      where: { id: recipeId },
      include: { tags: { include: { tag: true } } }
    })
    if (!recipe) throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })
    return {
      component: 'recipe-detail',
      recipe: {
        id: recipe.id,
        title: recipe.title,
        content: recipe.content,
        tags: recipe.tags.map(rt => rt.tag.label),
        updated_at: recipe.updated_at
      }
    }
  }

  // Recipe list
  const where = {
    ...(search ? {
      OR: [
        { title:   { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}),
    ...(tag ? { tags: { some: { tag: { label: tag } } } } : {})
  }

  const [tags, items, total] = await Promise.all([
    db.tag.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] }),
    db.recipe.findMany({
      where,
      select: { id: true, title: true, content: true, tags: { include: { tag: true } } },
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: limit
    }),
    db.recipe.count({ where })
  ])

  const makeSnippet = (content: string) => {
    if (!search) return null
    const idx = content.toLowerCase().indexOf(search.toLowerCase())
    if (idx < 0) return null
    const start = Math.max(0, idx - 40)
    const end = Math.min(content.length, idx + search.length + 40)
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
  }

  return {
    component: 'recipes',
    tags,
    recipes: items.map(r => ({
      id: r.id,
      title: r.title,
      tags: r.tags.map(rt => rt.tag.label),
      hasContent: r.content.length > 0,
      snippet: makeSnippet(r.content)
    })),
    total,
    hasMore: offset + items.length < total,
    activeTag: tag,
    activeSearch: search
  }
})
