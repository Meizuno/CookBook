import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod/v3'
import { toJson } from './helpers'

export function registerRecipeTools(server: McpServer, db: PrismaClient) {
  server.registerTool(
    'list_recipes',
    {
      description: 'List recipes with optional tag filter and pagination. Returns items (id, title, tags, hasContent), total count, and hasMore flag. Use get_recipe for full content. Default limit is 20.',
      inputSchema: z.object({
        tag: z.string().optional().describe('Filter by exact tag label.'),
        limit: z.number().int().optional().describe('Max items to return (default 20, max 100).'),
        offset: z.number().int().optional().describe('Number of items to skip (default 0).')
      })
    },
    async ({ tag, limit, offset }) => {
      const take = Math.min(limit ?? 20, 100)
      const skip = offset ?? 0
      const where = tag ? { tags: { some: { tag: { label: tag } } } } : {}

      const [recipes, total] = await Promise.all([
        db.recipe.findMany({
          where,
          select: {
            id: true,
            title: true,
            content: true,
            tags: { select: { tag_id: true } }
          },
          orderBy: { updated_at: 'desc' },
          take,
          skip
        }),
        db.recipe.count({ where })
      ])

      return toJson({
        items: recipes.map(r => ({
          id: r.id,
          title: r.title,
          tagIds: r.tags.map(rt => rt.tag_id),
          hasContent: r.content.length > 0
        })),
        total,
        hasMore: skip + recipes.length < total
      })
    }
  )

  server.registerTool(
    'get_recipe',
    {
      description: 'Get full recipe by id. Returns title, content (markdown), tags, and timestamps.',
      inputSchema: z.object({
        id: z.number().int().describe('(required) Recipe ID.')
      })
    },
    async ({ id }) => {
      const recipe = await db.recipe.findFirst({
        where: { id },
        include: { tags: { include: { tag: true } } }
      })
      if (!recipe) return toJson({ error: 'Recipe not found' })
      return toJson({
        id: recipe.id,
        title: recipe.title,
        content: recipe.content,
        tags: recipe.tags.map(rt => rt.tag.label),
        updated_at: recipe.updated_at
      })
    }
  )
}
