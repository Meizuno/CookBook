<script setup lang="ts">
type Tag = { id: number, label: string, color: string }

const title = ref('')
const content = ref('')
const tagIds = ref<number[]>([])
const saving = ref(false)

const { data: tags } = await useFetch<Tag[]>('/api/tags')

async function save() {
  if (!title.value.trim() || saving.value) return
  saving.value = true
  try {
    const recipe = await $fetch<{ id: number }>('/api/recipes', {
      method: 'POST',
      body: { title: title.value, content: content.value, tagIds: tagIds.value }
    })
    await navigateTo(`/recipes/${recipe.id}`)
  } finally { saving.value = false }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold">New recipe</h1>
      <UButton to="/" icon="i-lucide-arrow-left" variant="ghost" color="neutral" size="sm" label="Back" />
    </div>

    <RecipeForm
      v-model:title="title"
      v-model:content="content"
      v-model:tag-ids="tagIds"
      :tags="tags ?? []"
      :saving="saving"
      submit-label="Save recipe"
      @submit="save"
      @cancel="navigateTo('/')"
    />
  </div>
</template>
