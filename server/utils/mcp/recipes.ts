import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod/v3'
import { toJson } from './helpers'

export function registerRecipeTools(server: McpServer, db: PrismaClient) {
  server.registerTool(
    'list_recipes',
    {
      description: 'List all recipes with optional tag filter. Returns id, title, tags, and hasContent flag (true if recipe has markdown content). Use get_recipe to read the full content.',
      inputSchema: z.object({
        tag: z.string().optional().describe('Filter by exact tag label.')
      })
    },
    async ({ tag }) => {
      const recipes = await db.recipe.findMany({
        where: tag ? { tags: { some: { tag: { label: tag } } } } : {},
        include: { tags: { include: { tag: true } } },
        orderBy: { updated_at: 'desc' }
      })
      return toJson(recipes.map(r => ({
        id: r.id,
        title: r.title,
        tags: r.tags.map(rt => rt.tag.label),
        hasContent: r.content.length > 0
      })))
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
