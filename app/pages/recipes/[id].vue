<script setup lang="ts">
type Tag = { id: number, label: string, color: string }
type RecipeTag = { tag_id: number, tag: Tag }
type Recipe = { id: number, title: string, content: string, tags: RecipeTag[], updated_at: string }

const route = useRoute()
const id = Number(route.params.id)

const { data: recipe, refresh: refreshRecipe } = await useFetch<Recipe>(`/api/recipes/${id}`)
const { data: allTags } = await useFetch<Tag[]>('/api/tags')

const editing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editTagIds = ref<number[]>([])
const saving = ref(false)

function startEdit() {
  if (!recipe.value) return
  editTitle.value = recipe.value.title
  editContent.value = recipe.value.content
  editTagIds.value = recipe.value.tags.map(rt => rt.tag_id)
  editing.value = true
}

async function saveEdit() {
  if (!editTitle.value.trim() || saving.value) return
  saving.value = true
  try {
    await $fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      body: { title: editTitle.value, content: editContent.value, tagIds: editTagIds.value }
    })
    await refreshRecipe()
    editing.value = false
  } finally { saving.value = false }
}

async function deleteRecipe() {
  await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
  await navigateTo('/')
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4" :class="editing ? 'pt-4 pb-2 h-[calc(100dvh-3rem)] overflow-hidden' : 'py-4'">
    <!-- Loading -->
    <div v-if="!recipe" class="space-y-4">
      <USkeleton class="h-8 w-64 rounded" />
      <USkeleton class="h-64 w-full rounded-xl" />
    </div>

    <!-- Edit mode -->
    <template v-else-if="editing">
      <RecipeForm
        v-model:title="editTitle"
        v-model:content="editContent"
        v-model:tag-ids="editTagIds"
        :tags="allTags ?? []"
        :saving="saving"
        submit-label="Save"
        @submit="saveEdit"
        @cancel="editing = false"
      />
    </template>

    <!-- View mode -->
    <template v-else>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">{{ recipe.title }}</h1>
        <div class="flex gap-1">
          <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="sm" @click="startEdit" />
          <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" @click="deleteRecipe" />
        </div>
      </div>

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
    </template>
  </div>
</template>
