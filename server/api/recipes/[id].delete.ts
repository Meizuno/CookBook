export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getPrisma()

  const existing = await db.recipe.findFirst({ where: { id, user_id: user.id, is_deleted: false } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })

  await db.recipe.update({ where: { id }, data: { is_deleted: true } })
  return { deleted: id }
})
