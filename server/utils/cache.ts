export async function invalidatePageCache() {
  const storage = useStorage('cache:nitro:routes')
  const keys = await storage.getKeys()
  await Promise.all(keys.map(key => storage.removeItem(key)))
}
