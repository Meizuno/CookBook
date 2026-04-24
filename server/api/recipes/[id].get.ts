export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const id = Number(getRouterParam(event, 'id'))

  const db = getPrisma()
  const recipe = await db.recipe.findFirst({
    where: { id, is_deleted: false },
    include: { tags: { include: { tag: true } } }
  })
  if (!recipe) throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })
  return recipe
})
