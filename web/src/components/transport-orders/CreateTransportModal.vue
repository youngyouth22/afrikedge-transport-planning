<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { vehiclesApi, type Vehicle } from '@/api/vehicles.api'
import { transportOrdersApi } from '@/api/transport-orders.api'
import { toast } from 'vue-sonner'
import { X, Truck, Calendar, CheckCircle2, Loader2, AlertTriangle } from '@lucide/vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const router = useRouter()
const vehicles = ref<Vehicle[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const selectedVehicleCode = ref<string>('')
const deliveryDate = ref<string>('')

const todayDate = new Date().toISOString().slice(0, 10)

onMounted(() => {
  loadVehicles()
})

watch(
  () => props.open,
  (val) => {
    if (val) {
      errorMessage.value = null
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      deliveryDate.value = tomorrow
      loadVehicles()
    }
  },
)

async function loadVehicles() {
  isLoading.value = true
  try {
    const list = await vehiclesApi.getActive()
    vehicles.value = list
    if (list.length > 0 && !selectedVehicleCode.value) {
      selectedVehicleCode.value = list[0].code
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Erreur lors du chargement des véhicules.'
  } finally {
    isLoading.value = false
  }
}

const selectedVehicle = computed(() => {
  return vehicles.value.find((v) => v.code === selectedVehicleCode.value)
})

async function handleSubmit() {
  if (!selectedVehicleCode.value) {
    toast.error('Veuillez sélectionner un véhicule.')
    return
  }

  if (!deliveryDate.value) {
    toast.error('Veuillez choisir une date de livraison.')
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await transportOrdersApi.create({
      vehicleCode: selectedVehicleCode.value,
      deliveryDate: deliveryDate.value,
    })

    toast.success(`Ordre de transport ${res.no} créé avec succès !`, {
      description: 'Vous pouvez maintenant lui assigner des commandes.',
    })

    emit('success')
    emit('close')
    // Ouverture automatique du détail après création pour fluidifier l'UX
    router.push(`/transport-orders/${res.no}`)
  } catch (err: any) {
    errorMessage.value = err.message || "Erreur lors de la création de l'ordre de transport."
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
      class="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border pb-4">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Créer un ordre de transport</h3>
            <p class="text-xs text-muted-foreground">Statut initial : Brouillon (0)</p>
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

      <!-- Form Inputs -->
      <div class="space-y-4">
        <!-- Véhicule actif -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Véhicule affecté</span>
            <span v-if="selectedVehicle" class="text-[11px] font-normal text-muted-foreground">
              Capacité max : {{ selectedVehicle.capacityKg.toLocaleString('fr-FR') }} kg
            </span>
          </label>
          <select
            v-model="selectedVehicleCode"
            class="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option
              v-for="v in vehicles"
              :key="v.code"
              :value="v.code"
            >
              {{ v.code }} — {{ v.plateNo }} ({{ v.capacityKg.toLocaleString('fr-FR') }} kg)
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
          <p class="text-[11px] text-muted-foreground">
            Règle : un véhicule ne peut être affecté qu'à un seul ordre par date.
          </p>
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
          :disabled="isSubmitting || !selectedVehicleCode || !deliveryDate"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <CheckCircle2 v-else class="h-4 w-4" />
          <span>{{ isSubmitting ? 'Création en cours...' : 'Créer l\'ordre' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
