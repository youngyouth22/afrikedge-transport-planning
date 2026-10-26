<script setup lang="ts">
import { useUserStore, AVAILABLE_USERS, type UserId } from '@/stores/user'
import { toast } from 'vue-sonner'
import { Check, ChevronDown, UserCheck, Shield, Truck } from '@lucide/vue'
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const userStore = useUserStore()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

function switchUser(id: UserId) {
  if (userStore.currentUserId === id) {
    isOpen.value = false
    return
  }

  userStore.setUser(id)
  isOpen.value = false
  const user = AVAILABLE_USERS[id]
  toast.info(`Profil basculé : ${user.name} (${user.roleLabel})`, {
    description: `Les permissions et actions affichées sont désormais celles du rôle ${user.role}.`,
  })
}
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="flex items-center gap-2.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
    >
      <!-- Avatar miniature -->
      <div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-primary-foreground">
        {{ userStore.currentUser.initials }}
      </div>

      <div class="flex flex-col text-left">
        <span class="font-semibold leading-tight text-foreground">{{ userStore.currentUser.name }}</span>
        <span class="text-[10px] text-muted-foreground leading-none">{{ userStore.currentUser.roleLabel }}</span>
      </div>

      <span class="ml-1 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
        {{ userStore.currentUser.role }}
      </span>

      <ChevronDown class="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-card p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        Basculer d'identité (Test des rôles)
      </div>

      <div class="space-y-1">
        <!-- Option Diane -->
        <button
          type="button"
          @click="switchUser('diane')"
          class="flex w-full items-start gap-3 rounded-xl p-2.5 text-left text-xs transition hover:bg-accent cursor-pointer"
          :class="{ 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20': userStore.currentUserId === 'diane' }"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-xs">
            DI
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-foreground">Diane</span>
              <Check v-if="userStore.currentUserId === 'diane'" class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Truck class="h-3 w-3" />
              <span>DISPATCHER (Répartitrice)</span>
            </div>
            <p class="mt-1 text-[10px] text-muted-foreground leading-snug">
              Création, affectation, départs.
            </p>
          </div>
        </button>

        <!-- Option Eric -->
        <button
          type="button"
          @click="switchUser('eric')"
          class="flex w-full items-start gap-3 rounded-xl p-2.5 text-left text-xs transition hover:bg-accent cursor-pointer"
          :class="{ 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20': userStore.currentUserId === 'eric' }"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-800 font-bold text-white text-xs">
            ER
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-foreground">Eric</span>
              <Check v-if="userStore.currentUserId === 'eric'" class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Shield class="h-3 w-3" />
              <span>LOGISTICS_MANAGER</span>
            </div>
            <p class="mt-1 text-[10px] text-muted-foreground leading-snug">
              Supervision + Validation des ordres.
            </p>
          </div>
        </button>
      </div>

      <div class="mt-2 border-t border-border pt-2 px-2">
        <router-link
          to="/select-user"
          @click="isOpen = false"
          class="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <UserCheck class="h-3 w-3" />
          <span>Ouvrir l'écran d'accueil des profils</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
