<script setup lang="ts">
const { user, loggedIn, logout } = useAuth()

// Server-side fetch: page HTML isn't cached across users (only the
// RecipeView island fragment is, and that's user-agnostic markdown),
// so it's fine to bake the current user into the SSR response.
const { data: meData } = await useFetch<{ user: AuthUser }>('/api/auth/me')
user.value = meData.value?.user ?? null

const userMenuItems = computed(() => [
  [
    {
      label: user.value?.name ?? '',
      avatar: { src: user.value?.picture ?? undefined, alt: user.value?.name ?? undefined },
      disabled: true
    }
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: logout
    }
  ]
])
</script>

<template>
  <!-- Hiding /login is done in app.vue (route-based v-if). -->
  <header class="h-12 border-b border-default">
    <div class="flex items-center justify-between h-full max-w-3xl mx-auto px-4">
      <!-- Brand -->
      <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/favicon.svg" class="w-6 h-6" alt="logo">
        <span class="font-semibold text-sm hidden sm:block">Cook Book</span>
      </NuxtLink>

      <!-- Nav + User -->
      <div class="flex items-center gap-1">
        <UButton
          to="/tags"
          icon="i-lucide-tags"
          variant="ghost"
          color="neutral"
          size="xs"
        />
        <UButton
          to="/recipes/new"
          icon="i-lucide-plus"
          variant="ghost"
          color="neutral"
          size="xs"
        />

        <UDropdownMenu v-if="loggedIn" :items="userMenuItems" :ui="{ content: 'w-52' }">
          <UButton variant="ghost" color="neutral" size="sm" class="gap-1.5 px-2">
            <UAvatar :src="user?.picture ?? undefined" :alt="user?.name ?? undefined" size="xs" />
            <span class="text-xs font-medium hidden sm:block max-w-28 truncate">{{ user?.name }}</span>
            <UIcon name="i-lucide-chevron-down" class="size-3 text-muted shrink-0" />
          </UButton>
        </UDropdownMenu>
      </div>
    </div>
  </header>
</template>
