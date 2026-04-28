<script setup lang="ts">
import { loadRecipe } from '~~/server/utils/recipes'

// Server-only component → rendered as a Nuxt Island.
//
// The HTML produced here is cached by `island-cache.ts` keyed on the
// props (`id` + `v`). The heavy MDC parse happens once on the server
// and the cached HTML is served on subsequent hits.
//
// `v` (version) is a cache-busting prop: pass `recipe.updated_at` from
// the parent so a successful edit invalidates the cached fragment.
//
// We read the DB directly via Prisma instead of looping back through
// `/api/recipes/<id>`. The outer island request has already been authed
// by `auth.ts`; re-fetching over HTTP just to re-validate auth would
// be wasted work.

const props = defineProps<{
  id: number
  v?: string | number
}>()

const recipe = await loadRecipe(props.id)
</script>

<template>
  <div v-if="recipe">
    <h1 class="text-2xl font-bold mb-4">{{ recipe.title }}</h1>

    <div v-if="recipe.tags.length" class="flex flex-wrap gap-1.5 mb-6">
      <span
        v-for="rt in recipe.tags"
        :key="rt.tag_id"
        class="px-2.5 py-1 rounded-full text-xs font-medium"
        :class="`bg-${rt.tag.color}-500/10 text-${rt.tag.color}-600 dark:text-${rt.tag.color}-400`"
      >{{ rt.tag.label }}</span>
    </div>

    <div class="prose prose-sm dark:prose-invert max-w-none">
      <MDC v-if="recipe.content" :value="recipe.content" />
      <p v-else class="text-muted italic">No content yet. Click edit to add a recipe.</p>
    </div>

    <p class="text-xs text-muted mt-8">
      Last updated: {{ new Date(recipe.updated_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' }) }}
    </p>
  </div>
  <p v-else class="text-sm text-muted">Recipe not found.</p>
</template>
