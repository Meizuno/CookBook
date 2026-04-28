<script setup lang="ts">
type Tag = { id: number, label: string, color: string }

defineProps<{
  tags: Tag[]
}>()

const selected = defineModel<number[]>({ default: () => [] })

function toggle(id: number) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}
</script>

<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1.5">
    <button
      v-for="tag in tags"
      :key="tag.id"
      type="button"
      class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
      :class="selected.includes(tag.id)
        ? `bg-${tag.color}-500 text-white`
        : `bg-${tag.color}-500/10 text-${tag.color}-600 dark:text-${tag.color}-400 hover:bg-${tag.color}-500/20`"
      @click="toggle(tag.id)"
    >
      {{ tag.label }}
    </button>
  </div>
</template>
