export default defineEventHandler((event) => {
  const path = event.path
  if (!path?.startsWith('/api/')) return

  event.node.res.on('finish', () => {
    const status = event.node.res.statusCode
    console.log(`[${event.method}] ${path} → ${status}`)
  })
})
