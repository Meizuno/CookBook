<script setup lang="ts">
type Tag = { id: number, label: string, color: string }
type RecipeTag = { tag_id: number, tag: Tag }
type Recipe = { id: number, title: string, content: string, tags: RecipeTag[], updated_at: string }

const route = useRoute()
const id = Number(route.params.id)

// `version` is a local cache-busting prop for the RecipeView island.
// Bumped on every successful edit so the next island fetch goes through.
const version = ref(0)

// Edit-mode state and lazily-loaded edit data. The parent never fetches
// the recipe or tags for *viewing* — that's the island's job, fully
// server-side. We only fetch when the user clicks "Edit", to populate
// the form.
const editing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editTagIds = ref<number[]>([])
const saving = ref(false)
const loadingEdit = ref(false)
const allTags = ref<Tag[] | null>(null)

async function startEdit() {
  if (loadingEdit.value) return
  loadingEdit.value = true
  try {
    const [recipe, tags] = await Promise.all([
      $fetch<Recipe>(`/api/recipes/${id}`),
      allTags.value ? Promise.resolve(allTags.value) : $fetch<Tag[]>('/api/tags')
    ])
    allTags.value = tags
    editTitle.value = recipe.title
    editContent.value = recipe.content
    editTagIds.value = recipe.tags.map(rt => rt.tag_id)
    editing.value = true
  }
  finally { loadingEdit.value = false }
}

async function saveEdit() {
  if (!editTitle.value.trim() || saving.value) return
  saving.value = true
  try {
    await $fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      body: { title: editTitle.value, content: editContent.value, tagIds: editTagIds.value }
    })
    version.value++  // invalidate the cached island for this recipe
    editing.value = false
  }
  finally { saving.value = false }
}

async function deleteRecipe() {
  await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
  await navigateTo('/')
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4" :class="editing ? 'pt-4 pb-2 h-[calc(100dvh-3rem)] overflow-hidden' : 'py-4'">
    <!-- Edit mode -->
    <template v-if="editing">
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
      <!-- Action buttons stay outside the island so they're interactive -->
      <div class="flex items-center justify-end gap-1 mb-4">
        <UButton
          icon="i-lucide-pencil"
          variant="ghost"
          color="neutral"
          size="sm"
          :loading="loadingEdit"
          @click="startEdit"
        />
        <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" @click="deleteRecipe" />
      </div>

      <!-- Server-rendered + cached island: title, tags, MDC body, date.
           `v` is a local counter that bumps on save to invalidate cache. -->
      <RecipeView :id="id" :v="version" />
    </template>
  </div>
</template>
