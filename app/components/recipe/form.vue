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
  <form class="flex flex-col gap-4 h-full" @submit.prevent="onSubmit">
    <UInput v-model="title" placeholder="Recipe title" size="lg" class="shrink-0" />

    <TagPicker v-model="tagIds" :tags="tags" class="shrink-0" />

    <!-- Mode toggle + actions -->
    <div class="flex items-center shrink-0">
      <div class="flex gap-1 rounded-lg bg-muted p-1">
        <UButton size="xs" :variant="mode === 'edit' ? 'solid' : 'ghost'" color="primary" icon="i-lucide-pencil" label="Edit" @click="mode = 'edit'" />
        <UButton size="xs" :variant="mode === 'preview' ? 'solid' : 'ghost'" color="primary" icon="i-lucide-eye" label="Preview" @click="mode = 'preview'" />
      </div>
      <div class="flex-1" />
      <div class="flex gap-2">
        <UButton variant="ghost" color="neutral" label="Cancel" size="xs" @click="emit('cancel')" />
        <UButton type="submit" color="primary" icon="i-lucide-save" :label="submitLabel ?? 'Save'" size="xs" :loading="saving" :disabled="!title.trim()" />
      </div>
    </div>

    <!-- Editor / Preview — fills remaining space -->
    <div class="flex-1 min-h-0 overflow-hidden mb-2">
      <UTextarea
        v-if="mode === 'edit'"
        ref="editor"
        v-model="displayContent"
        placeholder="Write your recipe in markdown…"
        class="font-mono text-sm w-full h-full [&>div]:h-full [&_textarea]:h-full [&_textarea]:resize-none"
      />
      <div v-else class="h-full overflow-y-auto rounded-xl border border-default px-6 py-4">
        <div v-if="content" class="prose prose-sm dark:prose-invert max-w-none">
          <MDC :value="content" />
        </div>
        <p v-else class="text-muted italic">Nothing to preview</p>
      </div>
    </div>

  </form>
</template>
