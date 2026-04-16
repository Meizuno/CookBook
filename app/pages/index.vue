<script setup lang="ts">
type Tag = { id: number, label: string, color: string }
type RecipeTag = { tag_id: number, tag: Tag }
type Recipe = { id: number, title: string, content: string, tags: RecipeTag[], updated_at: string }

const search = ref('')
const activeTag = ref('')

const { data: tags } = await useFetch<Tag[]>('/api/tags')

const { data: recipes, status, refresh: refreshRecipes } = await useFetch<Recipe[]>('/api/recipes', {
  query: computed(() => ({
    ...(search.value ? { search: search.value } : {}),
    ...(activeTag.value ? { tag: activeTag.value } : {})
  })),
  watch: [search, activeTag]
})

async function deleteRecipe(id: number) {
  await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
  await refreshRecipes()
}

function toggleTag(label: string) {
  activeTag.value = activeTag.value === label ? '' : label
}

function contentPreview(content: string) {
  const plain = content.replace(/[#*_`>\[\]()!-]/g, '').trim()
  return plain.length > 120 ? plain.slice(0, 120) + '…' : plain
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold">Recipes</h1>
      <div class="flex gap-2">
        <UButton to="/tags" icon="i-lucide-tags" variant="ghost" color="neutral" size="sm" label="Tags" />
        <UButton to="/recipes/new" icon="i-lucide-plus" color="primary" size="sm" label="New recipe" />
      </div>
    </div>

    <!-- Search + tag filter -->
    <div class="space-y-3 mb-6">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search recipes…" />
      <div v-if="tags?.length" class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in tags"
          :key="tag.id"
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
          :class="activeTag === tag.label
            ? `bg-${tag.color}-500 text-white`
            : `bg-${tag.color}-500/10 text-${tag.color}-600 dark:text-${tag.color}-400 hover:bg-${tag.color}-500/20`"
          @click="toggleTag(tag.label)"
        >
          {{ tag.label }}
        </button>
      </div>
    </div>

    <!-- Recipe list -->
    <div v-if="status === 'pending'" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-xl" />
    </div>
    <div v-else class="space-y-2">
      <NuxtLink
        v-for="recipe in recipes"
        :key="recipe.id"
        :to="`/recipes/${recipe.id}`"
        class="block rounded-xl border border-default p-4 hover:bg-elevated transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-sm truncate">{{ recipe.title }}</p>
            <p v-if="recipe.content" class="text-xs text-muted mt-1 line-clamp-2">
              {{ contentPreview(recipe.content) }}
            </p>
            <div v-if="recipe.tags.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="rt in recipe.tags"
                :key="rt.tag_id"
                class="px-2 py-0.5 rounded-full text-[10px] font-medium"
                :class="`bg-${rt.tag.color}-500/10 text-${rt.tag.color}-600 dark:text-${rt.tag.color}-400`"
              >{{ rt.tag.label }}</span>
            </div>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            @click.prevent="deleteRecipe(recipe.id)"
          />
        </div>
      </NuxtLink>
      <p v-if="!recipes?.length" class="text-sm text-muted text-center py-12">
        No recipes found. Create your first one!
      </p>
    </div>
  </div>
</template>
