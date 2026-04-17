<script setup lang="ts">
type Tag = { id: number, label: string, color: string }
type Recipe = { id: number, title: string, tagIds: number[], updated_at: string }
type RecipesResponse = { items: Recipe[], total: number, hasMore: boolean }

const LIMIT = 20
const search = ref('')
const activeTag = ref('')
const recipes = ref<Recipe[]>([])
const hasMore = ref(false)
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const sentinel = ref<HTMLElement | null>(null)

const { data: tags } = await useFetch<Tag[]>('/api/tags')
const tagById = computed(() => new Map(tags.value?.map(t => [t.id, t]) ?? []))

// SSR: initial load
const { data: initialData } = await useFetch<RecipesResponse>('/api/recipes', {
  params: { limit: LIMIT, offset: 0 }
})
recipes.value = initialData.value?.items ?? []
hasMore.value = initialData.value?.hasMore ?? false
total.value = initialData.value?.total ?? 0

async function fetchRecipes(offset = 0, append = false) {
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const data = await $fetch<RecipesResponse>('/api/recipes', {
      params: {
        limit: LIMIT,
        offset,
        ...(search.value ? { search: search.value } : {}),
        ...(activeTag.value ? { tag: activeTag.value } : {})
      }
    })
    recipes.value = append ? [...recipes.value, ...data.items] : data.items
    hasMore.value = data.hasMore
    total.value = data.total
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  fetchRecipes(recipes.value.length, true)
}

watch([search, activeTag], () => fetchRecipes())

if (import.meta.client) {
  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    watch(sentinel, (el) => {
      if (el) observer.observe(el)
    }, { immediate: true })
    onUnmounted(() => observer.disconnect())
  })
}

async function deleteRecipe(id: number) {
  await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
  recipes.value = recipes.value.filter(r => r.id !== id)
  total.value--
}

function toggleTag(label: string) {
  activeTag.value = activeTag.value === label ? '' : label
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-4">
    <!-- Search + tag filter -->
    <div class="space-y-3 mb-4">
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
      <p v-if="total > 0" class="text-xs text-muted">{{ total }} recipe{{ total === 1 ? '' : 's' }}</p>
    </div>

    <!-- Recipe list -->
    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="i in 5" :key="i" class="h-14 w-full rounded-xl" />
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
            <div v-if="recipe.tagIds.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="id in recipe.tagIds"
                :key="id"
                class="px-2 py-0.5 rounded-full text-[10px] font-medium"
                :class="tagById.get(id) ? `bg-${tagById.get(id)!.color}-500/10 text-${tagById.get(id)!.color}-600 dark:text-${tagById.get(id)!.color}-400` : ''"
              >{{ tagById.get(id)?.label }}</span>
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

      <div ref="sentinel" class="h-1" />

      <div v-if="loadingMore" class="flex justify-center py-4">
        <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
      </div>

      <p v-if="!recipes.length" class="text-sm text-muted text-center py-12">
        No recipes found. Create your first one!
      </p>
    </div>
  </div>
</template>
