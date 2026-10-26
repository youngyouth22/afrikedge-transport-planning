<script setup lang="ts">
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { Search, X, RefreshCw } from '@lucide/vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const store = useSalesOrdersStore()
</script>

<template>
  <div class="flex items-center justify-between flex-wrap sm:flex-nowrap gap-3 w-full">
    <!-- Search Bar à gauche, sans bordure, hauteur 46px, texte 16px regular -->
    <div
      class="flex items-center gap-2 px-2 w-full sm:w-80 md:w-96 h-11.5 border-none bg-transparent shadow-none"
    >
      <Search class="h-5 w-5 text-Mtexttextsecondary shrink-0" />
      <input
        v-model="store.searchQuery"
        type="text"
        class="font-normal w-full text-[16px] placeholder:text-Mtexttextinvert placeholder:font-normal placeholder:text-[16px] bg-transparent border-none outline-none hover:focus:active:outline-none hover:focus:active:border-none text-foreground"
        placeholder="Rechercher une commande..."
      />
      <button
        v-if="store.searchQuery"
        type="button"
        @click="store.searchQuery = ''"
        class="text-Mtexttextsecondary hover:text-foreground cursor-pointer shrink-0 p-1"
        title="Effacer la recherche"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Actions à droite : Select Villes (46px) + Button Refresh (46px) -->
    <div class="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
      <!-- Select Shadcn pour le filtre de ville avec croix pour réinitialiser à 'all' -->
      <div class="relative flex items-center">
        <Select
          :model-value="store.cityFilter"
          @update:model-value="(val) => store.setCityFilter(val as string)"
        >
          <SelectTrigger
            class="w-48 h-[46px]! !h-[46px] border border-Mborderborderprimary! bg-background dark:bg-card text-[16px] font-normal cursor-pointer"
            :class="{ 'pr-8': store.cityFilter !== 'all' }"
          >
            <SelectValue placeholder="Toutes les villes" class="text-[16px] font-normal" />
          </SelectTrigger>
          <SelectContent class="text-[16px] font-normal">
            <SelectItem value="all" class="text-[16px] font-normal">
              Toutes les villes
            </SelectItem>
            <SelectItem
              v-for="city in store.availableCities"
              :key="city"
              :value="city"
              class="text-[16px] font-normal"
            >
              {{ city }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Croix pour effacer et remettre à 'all' lorsque cityFilter !== 'all' -->
        <button
          v-if="store.cityFilter !== 'all'"
          type="button"
          @click.stop="store.setCityFilter('all')"
          class="absolute right-2.5 z-10 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-full hover:bg-muted transition-colors"
          title="Effacer le filtre et afficher toutes les villes"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Button Shadcn Refresh avec variant="outline" (hauteur 46px) -->
      <Button
        type="button"
        variant="outline"
        size="icon"
        @click="store.fetchOrders()"
        :disabled="store.isLoading"
        title="Rafraîchir les données"
        class="h-[46px] w-[46px] border border-Mborderborderprimary! bg-background dark:bg-card text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': store.isLoading }" />
      </Button>
    </div>
  </div>
</template>
