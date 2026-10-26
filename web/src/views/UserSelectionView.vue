<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserStore, AVAILABLE_USERS, type UserId, type UserRole } from "@/stores/user";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import LanguageSelector from "@/components/layout/LanguageSelector.vue";
import { toast } from "vue-sonner";
import { ArrowRight, ShieldCheck, Truck, UserCircle2 } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useI18n } from "vue-i18n";

const router = useRouter();
const userStore = useUserStore();
const { confirm, confirmDialogProps, handleConfirm, handleCancel } = useConfirmDialog();
const { t } = useI18n();

function getRoleLabel(role: UserRole, isFeminine = false): string {
  if (role === 'DISPATCHER') {
    return isFeminine ? t('roles.DISPATCHER.labelFeminine') : t('roles.DISPATCHER.label')
  }
  return isFeminine ? t('roles.LOGISTICS_MANAGER.labelFeminine') : t('roles.LOGISTICS_MANAGER.label')
}

async function selectUser(id: UserId) {
  const user = AVAILABLE_USERS[id];
  const roleLabel = getRoleLabel(user.role, id === 'diane');

  const confirmed = await confirm({
    title: t('users.loginTitle', { name: user.name }),
    description: t('users.loginDescription', { name: user.name, role: roleLabel }),
    confirmText: t('users.loginButton'),
    cancelText: t('common.cancel'),
    confirmVariant: "default",
    variant: "default",
    icon: user.role === "DISPATCHER" ? Truck : ShieldCheck,
  });
  if (!confirmed) return;

  userStore.setUser(id);
  toast.success(t('users.loginSuccessTitle', { name: user.name, role: roleLabel }), {
    description: t('users.loginSuccessDesc'),
  });
  router.push("/sales-orders");
}
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col items-center justify-center bg-Msurfacesurfacesecondary overflow-hidden p-6 text-white selection:bg-emerald-500 selection:text-white"
  >
    <!-- Top-right language selector -->
    <div class="absolute top-6 right-6 z-20">
      <LanguageSelector />
    </div>

    <div class="relative z-10 w-full max-w-4xl space-y-12 text-center">
      <!-- En-tête / Branding -->
      <div class="space-y-4">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-400 backdrop-blur-md"
        >
          <Truck class="h-3.5 w-3.5 text-emerald-400" />
          <span>{{ t('app.portalTitle') }}</span>
        </div>
        <h1
          class="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground"
        >
          {{ t('app.portalSubtitle') }}
        </h1>
        <p
          class="mx-auto max-w-xl text-base text-Mtexttextsecondary sm:text-lg"
        >
          {{ t('app.portalDescription') }}
        </p>
      </div>

      <!-- Les 2 Cartes avec cycle avatar au centre -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-3xl mx-auto">
        <!-- Carte Diane (DISPATCHER) -->
        <Card
          @click="selectUser('diane')"
          class="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:bg-slate-900 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer"
        >
          <CardContent class="p-0 flex flex-col items-center">
            <div
              class="absolute inset-0 rounded-3xl bg-linear-to-b from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />

            <!-- Cycle Avatar au centre -->
            <CardHeader class="p-0 mb-6">
              <div
                class="relative flex h-32 w-32 items-center justify-center rounded-full p-1 transition-transform duration-300 group-hover:scale-105"
              >
                <img
                  src="https://api.dicebear.com/10.x/initials/svg?seed=Diane"
                  alt="Diane"
                  class="h-full w-full rounded-full object-cover bg-slate-950"
                />
                <div
                  class="absolute -bottom-2 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-slate-950 shadow-md"
                >
                  <Truck class="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>

            <!-- Nom et rôle en bas -->
            <div class="relative z-10 space-y-2">
              <h2
                class="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors"
              >
                Diane
              </h2>
              <div
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300"
              >
                <span>DISPATCHER</span>
                <span class="text-emerald-500">·</span>
                <span class="text-slate-300 font-normal">{{ t('roles.DISPATCHER.labelFeminine') }}</span>
              </div>
              <p class="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
                {{ t('roles.DISPATCHER.description') }}
              </p>
            </div>

            <!-- Bouton d'action CTA survol -->
            <CardFooter class="p-0 mt-8 w-full flex justify-center">
              <Button
                variant="default"
                class="h-11.5 px-6 text-sm font-semibold hover:cursor-pointer"
                @click.stop="selectUser('diane')"
              >
                <span>{{ t('users.accessAs', { name: 'Diane' }) }}</span>
                <ArrowRight
                  class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>
            </CardFooter>
          </CardContent>
        </Card>

        <!-- Carte Eric (LOGISTICS_MANAGER) -->
        <Card
          @click="selectUser('eric')"
          class="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:bg-slate-900 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer"
        >
          <CardContent class="p-0 flex flex-col items-center">
            <div
              class="absolute inset-0 rounded-3xl bg-linear-to-b from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />

            <!-- Cycle Avatar au centre -->
            <CardHeader class="p-0 mb-6">
              <div
                class="relative flex h-32 w-32 items-center justify-center rounded-full p-1 transition-transform duration-300 group-hover:scale-105"
              >
                <img
                  src="https://api.dicebear.com/10.x/initials/svg?seed=Eric"
                  alt="Eric"
                  class="h-full w-full rounded-full object-cover bg-slate-950"
                />
                <div
                  class="absolute -bottom-2 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-500 text-slate-950 shadow-md"
                >
                  <ShieldCheck class="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>

            <!-- Nom et rôle en bas -->
            <div class="relative z-10 space-y-2">
              <h2
                class="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors"
              >
                Eric
              </h2>
              <div
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300"
              >
                <span>LOGISTICS_MANAGER</span>
                <span class="text-emerald-500">·</span>
                <span class="text-slate-300 font-normal">{{ t('roles.LOGISTICS_MANAGER.label') }}</span>
              </div>
              <p class="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
                {{ t('roles.LOGISTICS_MANAGER.description') }}
              </p>
            </div>

            <!-- Bouton d'action CTA survol -->
            <CardFooter class="p-0 mt-8 w-full flex justify-center">
              <Button
                variant="default"
                class="h-11.5 px-6 text-sm font-semibold hover:cursor-pointer"
                @click.stop="selectUser('eric')"
              >
                <span>{{ t('users.accessAs', { name: 'Eric' }) }}</span>
                <ArrowRight
                  class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>
            </CardFooter>
          </CardContent>
        </Card>
      </div>

      <!-- Info note -->
      <div
        class="flex items-center justify-center gap-2 text-xs text-slate-500"
      >
        <UserCircle2 class="h-4 w-4 text-emerald-500/60" />
        <span>{{ t('app.footerSwitchNote') }}</span>
      </div>
    </div>

    <!-- Dialogue de confirmation réutilisable Alert / AlertDialog -->
    <ConfirmDialog
      v-bind="confirmDialogProps"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>
