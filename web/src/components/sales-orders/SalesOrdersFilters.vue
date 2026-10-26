<script setup lang="ts">
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { Search, X, MapPin } from '@lucide/vue'

const store = useSalesOrdersStore()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div class="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <!-- Recherche texte -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Rechercher par commande, client ou ville..."
          class="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          v-if="store.searchQuery"
          type="button"
          @click="store.searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Filtre par Ville -->
      <div class="flex items-center gap-2">
        <div class="relative min-w-[180px]">
          <MapPin class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            :value="store.cityFilter"
            @change="(e: any) => store.setCityFilter(e.target.value)"
            class="w-full appearance-none rounded-xl border border-border bg-background py-2 pl-8 pr-8 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Toutes les villes</option>
            <option
              v-for="city in store.availableCities"
              :key="city"
              :value="city"
            >
              {{ city }}
            </option>
          </select>
        </div>

        <!-- Reset Button -->
        <button
          v-if="store.cityFilter !== 'all' || store.searchQuery"
          type="button"
          @click="() => { store.searchQuery = ''; store.setCityFilter('all') }"
          class="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
          title="Réinitialiser les filtres"
        >
          <X class="h-3.5 w-3.5" />
          <span>Effacer</span>
        </button>
      </div>
    </div>
  </div>
</template>
