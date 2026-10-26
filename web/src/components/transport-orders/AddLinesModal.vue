<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { salesOrdersApi, type SalesOrderToPlan } from '@/api/sales-orders.api'
import { transportOrdersApi } from '@/api/transport-orders.api'
import { toast } from 'vue-sonner'
import {
  X,
  Plus,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  MapPin,
  Inbox,
  FileText,
} from '@lucide/vue'
import TablePill from '@/components/shared/TablePill.vue'

const props = defineProps<{
  open: boolean
  transportNo: string
  currentWeightKg: number
  capacityKg: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const availableOrders = ref<SalesOrderToPlan[]>([])
const selectedNos = ref<Set<string>>(new Set())
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.open,
  (val) => {
    if (val) {
      selectedNos.value = new Set()
      errorMessage.value = null
      loadOrders()
    }
  },
)

async function loadOrders() {
  isLoading.value = true
  try {
    const res = await salesOrdersApi.getToPlan(undefined, 1, 100)
    availableOrders.value = res.data
  } catch (err: any) {
    errorMessage.value = err.message || 'Impossible de charger les commandes disponibles.'
  } finally {
    isLoading.value = false
  }
}


function toggleSelect(no: string) {
  const next = new Set(selectedNos.value)
  if (next.has(no)) next.delete(no)
  else next.add(no)
  selectedNos.value = next
}

const selectedOrders = computed(() => {
  return availableOrders.value.filter((o) => selectedNos.value.has(o.salesOrderNo))
})

const additionalWeightKg = computed(() => {
  const sum = selectedOrders.value.reduce((acc, o) => acc + o.totalWeightKg, 0)
  return Math.round(sum * 100) / 100
})

const newTotalWeightKg = computed(() => {
  return props.currentWeightKg + additionalWeightKg.value
})

const isOverCapacity = computed(() => {
  return newTotalWeightKg.value > props.capacityKg
})

async function handleConfirm() {
  if (selectedNos.value.size === 0) {
    toast.error('Veuillez sélectionner au moins une commande.')
    return
  }

  if (isOverCapacity.value) {
    toast.error('La capacité maximale du véhicule serait dépassée.')
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const ids = Array.from(selectedNos.value)
    await transportOrdersApi.addLines(props.transportNo, ids)

    toast.success(`${ids.length} commande(s) ajoutée(s) avec succès !`)
    emit('success')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || "Erreur lors de l'ajout des commandes."
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div
      class="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border pb-4 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plus class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">
              Ajouter des commandes à {{ transportNo }}
            </h3>
            <p class="text-xs text-muted-foreground">
              Sélectionnez les commandes à planifier compatibles avec la capacité restante.
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Erreur si présente -->
      <div
        v-if="errorMessage"
        class="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive shrink-0"
      >
        <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Erreur : </span>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Live Capacity Summary -->
      <div class="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-2 shrink-0">
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">Poids sélectionné :</span>
          <strong class="text-foreground">+{{ additionalWeightKg.toLocaleString('fr-FR') }} kg</strong>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">Nouveau poids total :</span>
          <strong :class="isOverCapacity ? 'text-destructive font-black' : 'text-foreground'">
            {{ newTotalWeightKg.toLocaleString('fr-FR') }} / {{ capacityKg.toLocaleString('fr-FR') }} kg
          </strong>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="isOverCapacity ? 'bg-destructive' : 'bg-primary'"
            :style="{ width: `${Math.min(100, (newTotalWeightKg / (capacityKg || 1)) * 100)}%` }"
          />
        </div>
        <div v-if="isOverCapacity" class="text-[11px] font-bold text-destructive flex items-center gap-1">
          <AlertTriangle class="h-3.5 w-3.5" />
          <span>Dépassement de capacité de {{ (newTotalWeightKg - capacityKg).toLocaleString('fr-FR') }} kg</span>
        </div>
      </div>

      <!-- Orders List Scrollable -->
      <div class="flex-1 overflow-y-auto min-h-[220px] rounded-2xl border border-border divide-y divide-border">
        <div v-if="isLoading" class="p-8 text-center text-xs text-muted-foreground">
          Chargement des commandes...
        </div>
        <div
          v-else-if="availableOrders.length === 0"
          class="flex flex-col items-center justify-center p-8 text-center"
        >
          <Inbox class="h-8 w-8 text-muted-foreground mb-2" />
          <p class="text-xs text-muted-foreground">Aucune commande disponible au statut À planifier.</p>
        </div>
        <div
          v-for="order in availableOrders"
          :key="order.salesOrderNo"
          @click="toggleSelect(order.salesOrderNo)"
          class="flex items-center justify-between p-3.5 hover:bg-accent/40 cursor-pointer transition text-xs"
          :class="{ 'bg-emerald-500/10 dark:bg-emerald-950/30': selectedNos.has(order.salesOrderNo) }"
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="selectedNos.has(order.salesOrderNo)"
              @click.stop="toggleSelect(order.salesOrderNo)"
              class="w-[20px] h-[20px] border !border-Mgray400 rounded-[4px] accent-emerald-600 cursor-pointer"
            />
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-full bg-Msurfacesurfacesecondary border !border-Mborderborderprimary flex items-center justify-center shrink-0">
                <FileText class="h-3.5 w-3.5 text-Mtexttextsecondary" />
              </div>
              <div>
                <div class="font-medium text__16 text-Mtexttextprimary">{{ order.salesOrderNo }}</div>
                <div class="text-xs text-Mtexttextsecondary">{{ order.customerName }}</div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <TablePill :icon="MapPin" icon-class="text-Mmaincolorgreen">
              {{ order.deliveryCity }}
            </TablePill>
            <div class="font-medium text__14 text-Mtexttextprimary">
              {{ order.totalWeightKg.toLocaleString('fr-FR') }} kg
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-between border-t border-border pt-4 shrink-0">
        <div class="text-xs text-muted-foreground">
          <strong class="text-foreground">{{ selectedNos.size }}</strong> commande(s) sélectionnée(s)
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
          >
            Annuler
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="isSubmitting || selectedNos.size === 0 || isOverCapacity"
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <CheckCircle2 v-else class="h-4 w-4" />
            <span>{{ isSubmitting ? 'Ajout en cours...' : 'Ajouter les commandes' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
