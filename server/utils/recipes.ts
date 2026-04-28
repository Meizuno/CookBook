import { getPrisma } from './db'

// Shared recipe-loading projection used by both `/api/recipes/[id]` and
// the `RecipeView` island component. Centralizing the select here keeps
// the projection identical across both call sites and lets the island
// hit the DB directly (no HTTP loopback, no auth handshake — its outer
// island request was already authed by the time setup runs).
//
// `getPrisma` is imported explicitly (not via Nitro auto-import) because
// this file is also pulled into the Vue server bundle for the island
// component, where Nitro auto-imports don't apply.

export type RecipeWithTags = {
  id: number
  title: string
  content: string
  updated_at: Date
  tags: { tag_id: number, tag: { id: number, label: string, color: string } }[]
}

export function loadRecipe(id: number): Promise<RecipeWithTags | null> {
  return getPrisma().recipe.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      title: true,
      content: true,
      updated_at: true,
      tags: {
        select: {
          tag_id: true,
          tag: { select: { id: true, label: true, color: true } }
        }
      }
    }
  })
}
