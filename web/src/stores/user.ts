import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type UserId = 'diane' | 'eric'
export type UserRole = 'DISPATCHER' | 'LOGISTICS_MANAGER'

export interface UserProfile {
  id: UserId
  name: string
  role: UserRole
  roleLabel: string
  description: string
  initials: string
  avatarColor: string
  avatarUrl: string
}

export const AVAILABLE_USERS: Record<UserId, UserProfile> = {
  diane: {
    id: 'diane',
    name: 'Diane',
    role: 'DISPATCHER',
    roleLabel: 'Répartitrice',
    description: 'Crée les ordres, affecte les commandes et coordonne les départs des véhicules.',
    initials: 'DI',
    avatarColor: 'from-emerald-500 to-teal-600',
    avatarUrl: 'https://api.dicebear.com/10.x/initials/svg?seed=Diane',
  },
  eric: {
    id: 'eric',
    name: 'Eric',
    role: 'LOGISTICS_MANAGER',
    roleLabel: 'Responsable Logistique',
    description: 'Supervise les tournées, valide officiellement les ordres et contrôle les flux.',
    initials: 'ER',
    avatarColor: 'from-emerald-700 to-emerald-950',
    avatarUrl: 'https://api.dicebear.com/10.x/initials/svg?seed=Eric',
  },
}

export const useUserStore = defineStore('user', () => {
  const savedUser = (localStorage.getItem('afrikedge_current_user') as UserId) || null
  const currentUserId = ref<UserId>(savedUser && AVAILABLE_USERS[savedUser] ? savedUser : 'diane')
  const hasChosenUser = ref<boolean>(!!savedUser)

  const currentUser = computed(() => AVAILABLE_USERS[currentUserId.value])
  const isDispatcher = computed(() => currentUser.value.role === 'DISPATCHER')
  const isLogisticsManager = computed(() => currentUser.value.role === 'LOGISTICS_MANAGER')

  // Permissions métier
  const canValidate = computed(() => isLogisticsManager.value)
  const canDepart = computed(() => true) // Les deux rôles peuvent marquer parti
  const canModifyDraft = computed(() => true) // Les deux rôles peuvent créer/modifier brouillons

  function setUser(id: UserId) {
    if (AVAILABLE_USERS[id]) {
      currentUserId.value = id
      hasChosenUser.value = true
      localStorage.setItem('afrikedge_current_user', id)
    }
  }

  function clearUser() {
    localStorage.removeItem('afrikedge_current_user')
    hasChosenUser.value = false
  }

  return {
    currentUserId,
    currentUser,
    hasChosenUser,
    isDispatcher,
    isLogisticsManager,
    canValidate,
    canDepart,
    canModifyDraft,
    setUser,
    clearUser,
  }
})
