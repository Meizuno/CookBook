export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  // Invalidate page cache after any mutation
  event.node.res.on('finish', () => {
    if (event.node.res.statusCode < 400) {
      invalidatePageCache().catch(() => {})
    }
  })
})
