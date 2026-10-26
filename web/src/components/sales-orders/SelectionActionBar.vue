<script setup lang="ts">
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { PlusCircle, Weight, X, CheckSquare } from '@lucide/vue'

const store = useSalesOrdersStore()

defineEmits<{
  (e: 'open-assign-modal'): void
}>()
</script>

<template>
  <Transition
    enter-active-class="transform transition ease-out duration-300"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transform transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="store.selectedCount > 0"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-slate-950/90 px-6 py-3.5 shadow-2xl backdrop-blur-xl text-white"
    >
      <!-- Compteur sélection -->
      <div class="flex items-center gap-2 border-r border-slate-800 pr-4">
        <CheckSquare class="h-4 w-4 text-emerald-400" />
        <span class="text-xs font-semibold">
          <strong class="text-emerald-400 font-bold text-sm">{{ store.selectedCount }}</strong>
          {{ store.selectedCount > 1 ? 'commandes' : 'commande' }}
        </span>
      </div>

      <!-- Poids cumulé -->
      <div class="flex items-center gap-2 border-r border-slate-800 pr-4">
        <Weight class="h-4 w-4 text-emerald-400" />
        <div class="flex items-baseline gap-1">
          <span class="text-xs text-slate-400">Poids total :</span>
          <strong class="text-sm font-bold text-white tracking-wide">
            {{ store.selectedTotalWeight.toLocaleString('fr-FR') }}
          </strong>
          <span class="text-xs text-emerald-400 font-medium">kg</span>
        </div>
      </div>

      <!-- Bouton Annuler sélection -->
      <button
        type="button"
        @click="store.clearSelection()"
        class="inline-flex items-center gap-1 rounded-xl p-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
        title="Désélectionner tout"
      >
        <X class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Annuler</span>
      </button>

      <!-- Action Button -->
      <button
        type="button"
        @click="$emit('open-assign-modal')"
        class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-emerald-400 transition transform hover:scale-105 active:scale-95"
      >
        <PlusCircle class="h-4 w-4" />
        <span>Ajouter à un transport</span>
      </button>
    </div>
  </Transition>
</template>
