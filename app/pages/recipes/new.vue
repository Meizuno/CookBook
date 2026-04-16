<script setup lang="ts">
type Tag = { id: number, label: string, color: string }

const title = ref('')
const content = ref('')
const tagIds = ref<number[]>([])
const saving = ref(false)

// SSR: tags loaded on server
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
