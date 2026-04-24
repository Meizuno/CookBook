export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const { title, content, tagIds } = await readBody<{ title?: string, content?: string, tagIds?: number[] }>(event)

  const db = getPrisma()

  // Verify ownership
  const existing = await db.recipe.findFirst({ where: { id, user_id: user.id, is_deleted: false } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })

  // Sync tags if provided
  if (tagIds !== undefined) {
    await db.recipeTag.deleteMany({ where: { recipe_id: id } })
    if (tagIds.length) {
      await db.recipeTag.createMany({ data: tagIds.map(tag_id => ({ recipe_id: id, tag_id })) })
    }
  }

  return db.recipe.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(content !== undefined ? { content } : {})
    },
    include: { tags: { include: { tag: true } } }
  })
})
