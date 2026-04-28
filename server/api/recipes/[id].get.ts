export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const id = Number(getRouterParam(event, 'id'))

  const recipe = await loadRecipe(id)
  if (!recipe) throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })
  return recipe
})
