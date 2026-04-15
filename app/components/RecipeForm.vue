<script setup lang="ts">
type Tag = { id: number, label: string, color: string }

const props = defineProps<{
  tags: Tag[]
  saving?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const title = defineModel<string>('title', { default: '' })
const content = defineModel<string>('content', { default: '' })
const tagIds = defineModel<number[]>('tagIds', { default: () => [] })

const mode = ref<'edit' | 'preview'>('edit')
const editorRef = useTemplateRef<any>('editor')
const { displayContent } = useImagePaste(content, editorRef)

function onSubmit() {
  if (!title.value.trim() || props.saving) return
  emit('submit')
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UInput v-model="title" placeholder="Recipe title" size="lg" />

    <TagPicker v-model="tagIds" :tags="tags" />

    <!-- Mode toggle -->
    <div class="flex gap-1 rounded-lg bg-muted p-1 w-fit">
      <UButton size="xs" :variant="mode === 'edit' ? 'solid' : 'ghost'" color="primary" icon="i-lucide-pencil" label="Edit" @click="mode = 'edit'" />
      <UButton size="xs" :variant="mode === 'preview' ? 'solid' : 'ghost'" color="primary" icon="i-lucide-eye" label="Preview" @click="mode = 'preview'" />
    </div>

    <!-- Editor -->
    <UTextarea
      v-if="mode === 'edit'"
      ref="editor"
      v-model="displayContent"
      placeholder="Write your recipe in markdown…"
      :rows="16"
      autoresize
      class="font-mono text-sm w-full"
    />

    <!-- Preview -->
    <div v-else class="rounded-xl border border-default px-6 pb-6 min-h-96">
      <div v-if="content" class="prose prose-sm dark:prose-invert max-w-none">
        <MDC :value="content" />
      </div>
      <p v-else class="text-muted italic">Nothing to preview</p>
    </div>

    <div class="flex justify-end gap-2">
      <UButton variant="ghost" color="neutral" label="Cancel" @click="emit('cancel')" />
      <UButton type="submit" color="primary" icon="i-lucide-save" :label="submitLabel ?? 'Save'" :loading="saving" :disabled="!title.trim()" />
    </div>
  </form>
</template>
