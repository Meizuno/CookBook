import { clearPageCache } from './page-cache'

export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  event.node.res.on('finish', () => {
    if (event.node.res.statusCode < 400) {
      clearPageCache()
    }
  })
})
