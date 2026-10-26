<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { vehiclesApi, type Vehicle } from '@/api/vehicles.api'
import { transportOrdersApi, type TransportOrderSummary } from '@/api/transport-orders.api'
import { toast } from 'vue-sonner'
import {
  X,
  Truck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Loader2,
} from '@lucide/vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const router = useRouter()
const store = useSalesOrdersStore()

const mode = ref<'new' | 'existing'>('new')
const activeVehicles = ref<Vehicle[]>([])
const draftTransports = ref<TransportOrderSummary[]>([])
const isLoadingVehicles = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Form fields for new transport
const selectedVehicleCode = ref<string>('')
const deliveryDate = ref<string>('')

// Form fields for existing draft transport
const selectedDraftNo = ref<string>('')

const todayDate = new Date().toISOString().slice(0, 10)

onMounted(async () => {
  loadData()
})

watch(
  () => props.open,
  (val) => {
    if (val) {
      errorMessage.value = null
      // Default delivery date to tomorrow
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      deliveryDate.value = tomorrow
      loadData()
    }
  },
)

async function loadData() {
  isLoadingVehicles.value = true
  try {
    const [vehicles, transportsRes] = await Promise.all([
      vehiclesApi.getActive(),
      transportOrdersApi.getAll({ status: 0, limit: 100 }),
    ])
    activeVehicles.value = vehicles
    if (vehicles.length > 0 && !selectedVehicleCode.value) {
      selectedVehicleCode.value = vehicles[0].code
    }

    const transports = transportsRes.data
    draftTransports.value = transports
    if (transports.length > 0 && !selectedDraftNo.value) {
      selectedDraftNo.value = transports[0].no
    }

  } catch (err: any) {
    errorMessage.value = err.message || 'Erreur lors du chargement des véhicules.'
  } finally {
    isLoadingVehicles.value = false
  }
}

// Current vehicle capacity
const targetCapacityKg = computed(() => {
  if (mode.value === 'new') {
    const v = activeVehicles.value.find((veh) => veh.code === selectedVehicleCode.value)
    return v ? v.capacityKg : 0
  } else {
    const draft = draftTransports.value.find((d) => d.no === selectedDraftNo.value)
    return draft ? draft.vehicleCapacityKg : 0
  }
})

// Current weight already in transport (0 for new)
const currentWeightKg = computed(() => {
  if (mode.value === 'new') return 0
  const draft = draftTransports.value.find((d) => d.no === selectedDraftNo.value)
  return draft ? draft.totalWeightKg : 0
})

// Selected weight to add
const additionalWeightKg = computed(() => store.selectedTotalWeight)

// Projected total weight
const projectedWeightKg = computed(() => currentWeightKg.value + additionalWeightKg.value)

// Fill ratio
const fillPercentage = computed(() => {
  if (targetCapacityKg.value <= 0) return 0
  return Math.min(100, Math.round((projectedWeightKg.value / targetCapacityKg.value) * 100))
})

const isOverCapacity = computed(() => {
  return projectedWeightKg.value > targetCapacityKg.value
})

const remainingCapacityKg = computed(() => {
  return targetCapacityKg.value - projectedWeightKg.value
})

async function handleSubmit() {
  if (store.selectedCount === 0) {
    toast.error('Aucune commande sélectionnée.')
    return
  }

  if (isOverCapacity.value) {
    toast.error('La capacité maximale du véhicule est dépassée.')
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    let targetOrderNo = ''

    if (mode.value === 'new') {
      if (!selectedVehicleCode.value) {
        throw new Error('Veuillez sélectionner un véhicule.')
      }
      if (!deliveryDate.value) {
        throw new Error('Veuillez choisir une date de livraison.')
      }

      // 1. Créer le transport
      const createRes = await transportOrdersApi.create({
        vehicleCode: selectedVehicleCode.value,
        deliveryDate: deliveryDate.value,
      })
      targetOrderNo = createRes.no
    } else {
      if (!selectedDraftNo.value) {
        throw new Error('Veuillez sélectionner un brouillon existant.')
      }
      targetOrderNo = selectedDraftNo.value
    }

    // 2. Affecter les lignes en une seule opération atomique
    const salesOrderNos = Array.from(store.selectedOrderNos)
    await transportOrdersApi.addLines(targetOrderNo, salesOrderNos)

    toast.success(`Affectation réussie pour l'ordre ${targetOrderNo}`, {
      description: `${salesOrderNos.length} commandes affectées (${store.selectedTotalWeight} kg).`,
      action: {
        label: 'Voir le détail',
        onClick: () => router.push(`/transport-orders/${targetOrderNo}`),
      },
    })

    store.clearSelection()
    emit('success')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || "Erreur lors de l'affectation au transport."
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div
      class="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border pb-4">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Boxes class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Ajouter à un transport</h3>
            <p class="text-xs text-muted-foreground">
              {{ store.selectedCount }} commande(s) sélectionnée(s) · {{ store.selectedTotalWeight }} kg
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

      <!-- Erreur globale si présente -->
      <div
        v-if="errorMessage"
        class="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
      >
        <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Erreur : </span>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Mode Selector (Tabs) -->
      <div class="flex rounded-xl bg-muted p-1 text-xs font-semibold">
        <button
          type="button"
          @click="mode = 'new'"
          class="flex-1 rounded-lg py-2 transition"
          :class="mode === 'new' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        >
          Créer un nouvel ordre
        </button>
        <button
          type="button"
          @click="mode = 'existing'"
          class="flex-1 rounded-lg py-2 transition"
          :class="mode === 'existing' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        >
          Brouillon existant
        </button>
      </div>

      <!-- Form Content -->
      <div class="space-y-4">
        <!-- MODE 1: NOUVEL ORDRE -->
        <template v-if="mode === 'new'">
          <!-- Véhicule actif -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <Truck class="h-3.5 w-3.5 text-muted-foreground" />
                <span>Véhicule actif</span>
              </span>
              <span class="text-[11px] font-normal text-muted-foreground">
                Capacité : {{ targetCapacityKg.toLocaleString('fr-FR') }} kg
              </span>
            </label>
            <select
              v-model="selectedVehicleCode"
              class="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option
                v-for="v in activeVehicles"
                :key="v.code"
                :value="v.code"
              >
                {{ v.code }} — {{ v.plateNo }} ({{ v.capacityKg.toLocaleString('fr-FR') }} kg max)
              </option>
            </select>
          </div>

          <!-- Date de livraison -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
              <span>Date de livraison prévue</span>
            </label>
            <input
              v-model="deliveryDate"
              type="date"
              :min="todayDate"
              class="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>
        </template>

        <!-- MODE 2: BROUILLON EXISTANT -->
        <template v-else>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Sélectionner un brouillon compatible</span>
              <span class="text-[11px] text-muted-foreground">{{ draftTransports.length }} disponible(s)</span>
            </label>
            <div v-if="draftTransports.length === 0" class="text-xs text-muted-foreground italic p-2 border border-dashed rounded-xl">
              Aucun ordre au statut Brouillon n'est actuellement disponible.
            </div>
            <select
              v-else
              v-model="selectedDraftNo"
              class="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option
                v-for="d in draftTransports"
                :key="d.no"
                :value="d.no"
              >
                {{ d.no }} · {{ d.vehiclePlateNo }} · {{ d.deliveryDate }} ({{ d.totalWeightKg }} / {{ d.vehicleCapacityKg }} kg)
              </option>
            </select>
          </div>
        </template>

        <!-- JAUGE DE CHARGE PRÉVISIONNELLE -->
        <div class="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-foreground">Jauge prévisionnelle</span>
            <span
              class="font-extrabold text-xs"
              :class="isOverCapacity ? 'text-destructive font-black' : 'text-emerald-600 dark:text-emerald-400'"
            >
              {{ fillPercentage }} % utilisé
            </span>
          </div>

          <!-- Barre de progression -->
          <div class="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="isOverCapacity ? 'bg-destructive' : 'bg-primary'"
              :style="{ width: `${Math.min(100, (projectedWeightKg / (targetCapacityKg || 1)) * 100)}%` }"
            />
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50">
            <div>
              <span class="text-muted-foreground">Poids prévisionnel : </span>
              <strong class="text-foreground">{{ projectedWeightKg.toLocaleString('fr-FR') }} kg</strong>
            </div>
            <div class="text-right">
              <span class="text-muted-foreground">Capacité max : </span>
              <strong class="text-foreground">{{ targetCapacityKg.toLocaleString('fr-FR') }} kg</strong>
            </div>
            <div class="col-span-2">
              <span v-if="!isOverCapacity" class="text-emerald-600 dark:text-emerald-400 font-medium">
                Poids restant disponible : {{ remainingCapacityKg.toLocaleString('fr-FR') }} kg
              </span>
              <span v-else class="text-destructive font-bold flex items-center gap-1">
                <AlertTriangle class="h-3.5 w-3.5" />
                Dépassement de capacité de {{ Math.abs(remainingCapacityKg).toLocaleString('fr-FR') }} kg !
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          @click="$emit('close')"
          class="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
        >
          Annuler
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting || isOverCapacity || targetCapacityKg <= 0"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <CheckCircle2 v-else class="h-4 w-4" />
          <span>{{ isSubmitting ? 'Affectation en cours...' : 'Confirmer l\'affectation' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
