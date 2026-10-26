<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { vehiclesApi, type Vehicle } from '@/api/vehicles.api'
import { transportOrdersApi } from '@/api/transport-orders.api'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import {
  type DateValue,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'

// Shadcn UI components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

// Icons
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from '@lucide/vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const router = useRouter()
const vehicles = ref<Vehicle[]>([])
const isLoadingVehicles = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const isCalendarOpen = ref(false)

// Internationalized date limits
const minCalendarDate = today(getLocalTimeZone())
const minDateString = minCalendarDate.toString()
const defaultTomorrow = minCalendarDate.add({ days: 1 }).toString()

// Zod validation schema
const transportSchema = z.object({
  vehicleCode: z
    .string({ required_error: 'Veuillez sélectionner un véhicule.' })
    .min(1, 'Veuillez sélectionner un véhicule.'),
  deliveryDate: z
    .string({ required_error: 'Veuillez choisir une date de livraison.' })
    .min(1, 'Veuillez choisir une date de livraison.')
    .refine(
      (val) => {
        if (!val) return false
        return val >= minDateString
      },
      { message: 'La date de livraison ne peut pas être dans le passé.' },
    ),
})

type TransportFormValues = z.infer<typeof transportSchema>

const { handleSubmit, resetForm, setFieldValue, values } = useForm<TransportFormValues>({
  validationSchema: toTypedSchema(transportSchema),
  initialValues: {
    vehicleCode: '',
    deliveryDate: defaultTomorrow,
  },
})

onMounted(() => {
  loadVehicles()
})

watch(
  () => props.open,
  (val) => {
    if (val) {
      errorMessage.value = null
      isCalendarOpen.value = false
      setFieldValue('deliveryDate', defaultTomorrow)
      loadVehicles()
    } else {
      resetForm()
    }
  },
)

async function loadVehicles() {
  isLoadingVehicles.value = true
  try {
    const list = await vehiclesApi.getActive()
    vehicles.value = list
    if (list.length > 0 && !values.vehicleCode) {
      setFieldValue('vehicleCode', list[0].code)
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Erreur lors du chargement des véhicules.'
  } finally {
    isLoadingVehicles.value = false
  }
}

const selectedVehicle = computed(() => {
  return vehicles.value.find((v) => v.code === values.vehicleCode)
})

const calendarDateValue = computed<DateValue | undefined>(() => {
  if (!values.deliveryDate) return undefined
  try {
    return parseDate(values.deliveryDate)
  } catch {
    return undefined
  }
})

function handleCalendarSelect(date: DateValue | undefined) {
  if (date) {
    setFieldValue('deliveryDate', date.toString())
    isCalendarOpen.value = false
  }
}

function onOpenChange(isOpen: boolean) {
  if (!isOpen) {
    emit('close')
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  errorMessage.value = null
  isSubmitting.value = true

  try {
    const res = await transportOrdersApi.create({
      vehicleCode: formValues.vehicleCode,
      deliveryDate: formValues.deliveryDate,
    })

    toast.success(`Ordre de transport ${res.no} créé avec succès !`, {
      description: 'Vous pouvez maintenant lui assigner des commandes.',
    })

    emit('success')
    emit('close')
    router.push(`/transport-orders/${res.no}`)
  } catch (err: any) {
    errorMessage.value = err.message || "Erreur lors de la création de l'ordre de transport."
  } finally {
    isSubmitting.value = false
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md p-6 rounded-3xl border border-border bg-card shadow-2xl">
      <!-- Header -->
      <DialogHeader class="pb-4">
        <div class="flex items-center gap-3">
          <div class="space-y-0.5">
            <DialogTitle class="text-2xl font-bold text-foreground">
              Créer un ordre de transport
            </DialogTitle>
            <DialogDescription class="text-base text-muted-foreground">
              Statut initial : Brouillon (0)
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- Erreur globale avec composant Alert Shadcn -->
      <Alert
        v-if="errorMessage"
        variant="destructive"
      >
        <AlertCircleIcon class="h-4 w-4" />
        <AlertTitle>Erreur lors de la création</AlertTitle>
        <AlertDescription class="text-xs">
          {{ errorMessage }}
        </AlertDescription>
      </Alert>

      <!-- Formulaire avec composants Shadcn et validation Zod -->
      <form id="create-transport-form" @submit.prevent="onSubmit" class="space-y-4">
        <!-- Véhicule actif (Select Shadcn) -->
        <FormField v-slot="{ componentField }" name="vehicleCode">
          <FormItem class="space-y-1.5">
            <div class="flex items-center justify-between">
              <FormLabel class="text-sm font-medium text-foreground">
                Véhicule affecté
              </FormLabel>
              <Label
                v-if="selectedVehicle"
                class="text-[14px] font-normal text-muted-foreground"
              >
                Capacité max : {{ selectedVehicle.capacityKg.toLocaleString('fr-FR') }} kg
              </Label>
            </div>
            <Select
              v-bind="componentField"
              :model-value="values.vehicleCode"
              @update:model-value="(val) => setFieldValue('vehicleCode', val ? String(val) : '')"
              :disabled="isLoadingVehicles"
            >
              <FormControl>
                <SelectTrigger class="h-11.5 w-full rounded-xl text-xs font-medium cursor-pointer">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
              </FormControl>
              <SelectContent position="popper" class="z-200 w-(--reka-select-trigger-width) max-h-60">
                <SelectGroup>
                  <SelectItem
                    v-for="v in vehicles"
                    :key="v.code"
                    :value="v.code"
                    class="cursor-pointer text-xs"
                  >
                    {{ v.code }} — {{ v.plateNo }} ({{ v.capacityKg.toLocaleString('fr-FR') }} kg)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormMessage class="text-xs text-destructive" />
          </FormItem>
        </FormField>

        <!-- Date de livraison (Input 46px + Popover + Calendar Shadcn) -->
        <FormField v-slot="{ componentField }" name="deliveryDate">
          <FormItem class="space-y-1.5 flex flex-col">
            <FormLabel class="text-sm font-medium text-foreground">
              Date de livraison prévue
            </FormLabel>
            <div class="relative flex items-center w-full">
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="text"
                  placeholder="AAAA-MM-JJ"
                  class="h-11.5 w-full rounded-xl pr-12 text-xs text-foreground cursor-pointer"
                  @click="isCalendarOpen = true"
                />
              </FormControl>
              <Popover v-model:open="isCalendarOpen">
                <PopoverTrigger as-child>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                    title="Ouvrir le calendrier"
                  >
                    <CalendarIcon class="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  class="z-200 w-auto p-0 rounded-2xl border border-border shadow-2xl bg-popover"
                  align="end"
                  :side-offset="6"
                >
                  <Calendar
                    :model-value="calendarDateValue"
                    :min-value="minCalendarDate"
                    initial-focus
                    @update:model-value="handleCalendarSelect"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <FormDescription class="text-[11px] text-muted-foreground">
              Règle : un véhicule ne peut être affecté qu'à un seul ordre par date.
            </FormDescription>
            <FormMessage class="text-xs text-destructive" />
          </FormItem>
        </FormField>
      </form>

      <!-- Footer Buttons -->
      <DialogFooter class="-mx-6 -mb-6 mt-2 rounded-b-3xl border-t border-border bg-muted/40 p-4 flex flex-row items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          class="h-11.5 px-5 rounded-xl cursor-pointer"
          @click="emit('close')"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          form="create-transport-form"
          variant="default"
          class="h-11.5 px-5 rounded-xl cursor-pointer inline-flex items-center gap-2"
          :disabled="isSubmitting || isLoadingVehicles"
        >
          <Loader2Icon v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <CheckCircle2Icon v-else class="h-4 w-4" />
          <span>{{ isSubmitting ? 'Création en cours...' : 'Créer l\'ordre' }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
