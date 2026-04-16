<script setup lang="ts">
const { user, loggedIn, logout } = useAuth()
const route = useRoute()

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
  <header v-if="loggedIn" class="flex items-center justify-between px-4 py-2.5 border-b border-default">
    <!-- Brand -->
    <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <img src="/favicon.svg" class="w-6 h-6" alt="logo">
      <span class="font-semibold text-sm hidden sm:block">Cook Book</span>
    </NuxtLink>

    <!-- Nav + User -->
    <div class="flex items-center gap-1">
      <UButton
        v-if="route.path !== '/tags'"
        to="/tags"
        icon="i-lucide-tags"
        variant="ghost"
        color="neutral"
        size="xs"
      />
      <UButton
        v-if="route.path !== '/recipes/new'"
        to="/recipes/new"
        icon="i-lucide-plus"
        variant="ghost"
        color="neutral"
        size="xs"
      />

      <!-- User dropdown -->
      <UDropdownMenu :items="userMenuItems" :ui="{ content: 'w-52' }">
        <UButton variant="ghost" color="neutral" size="sm" class="gap-1.5 px-2">
          <UAvatar :src="user?.picture ?? undefined" :alt="user?.name ?? undefined" size="xs" />
          <span class="text-xs font-medium hidden sm:block max-w-28 truncate">{{ user?.name }}</span>
          <UIcon name="i-lucide-chevron-down" class="size-3 text-muted shrink-0" />
        </UButton>
      </UDropdownMenu>
    </div>
  </header>
</template>
