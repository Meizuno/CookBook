<script setup lang="ts">
type Tag = { id: number, label: string, color: string, position: number }

const newLabel = ref('')
const editingId = ref<number | null>(null)
const editLabel = ref('')

// SSR: initial tag list loaded on server
const { data: tags, refresh: refreshTags, status } = await useFetch<Tag[]>('/api/tags')

async function addTag() {
  if (!newLabel.value.trim()) return
  await $fetch('/api/tags', { method: 'POST', body: { label: newLabel.value.trim() } })
  newLabel.value = ''
  await refreshTags()
}

function startEdit(tag: Tag) {
  editingId.value = tag.id
  editLabel.value = tag.label
}

async function saveEdit(id: number) {
  if (!editLabel.value.trim()) return
  await $fetch(`/api/tags/${id}`, { method: 'PUT', body: { label: editLabel.value.trim() } })
  editingId.value = null
  await refreshTags()
}

async function deleteTag(id: number) {
  await $fetch(`/api/tags/${id}`, { method: 'DELETE' })
  await refreshTags()
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-8">
    <!-- Add tag -->
    <form class="flex gap-2 mb-6" @submit.prevent="addTag">
      <UInput v-model="newLabel" placeholder="New tag…" class="flex-1" />
      <UButton type="submit" icon="i-lucide-plus" color="primary" :disabled="!newLabel.trim()" />
    </form>

    <!-- Tag list -->
    <div v-if="status === 'pending' && !tags?.length" class="space-y-2">
      <USkeleton v-for="i in 4" :key="i" class="h-10 w-full rounded-lg" />
    </div>
    <div v-else class="space-y-1">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        :class="`bg-${tag.color}-500/10 hover:bg-${tag.color}-500/20`"
      >
        <span class="w-3 h-3 rounded-full shrink-0" :class="`bg-${tag.color}-500`" />
        <template v-if="editingId === tag.id">
          <UInput v-model="editLabel" size="sm" class="flex-1" @keydown.enter="saveEdit(tag.id)" />
          <UButton icon="i-lucide-check" variant="ghost" color="success" size="xs" @click="saveEdit(tag.id)" />
          <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" @click="editingId = null" />
        </template>
        <template v-else>
          <span class="flex-1 text-sm font-medium" :class="`text-${tag.color}-600 dark:text-${tag.color}-400`">{{ tag.label }}</span>
          <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="xs" @click="startEdit(tag)" />
          <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" @click="deleteTag(tag.id)" />
        </template>
      </div>
      <p v-if="!tags?.length" class="text-sm text-muted text-center py-8">
        No tags yet. Create your first one above.
      </p>
    </div>
  </div>
</template>
