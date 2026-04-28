<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({ title: 'Cook Book' })

// Hide the header on /login so it doesn't render on the static prerendered
// login page. AppHeader itself always renders its structure to avoid layout
// shift while client-side auth resolves.
const route = useRoute()
const showHeader = computed(() => route.path !== '/login')
</script>

<template>
  <UApp>
    <AppHeader v-if="showHeader" />
    <NuxtPage />
  </UApp>
</template>
