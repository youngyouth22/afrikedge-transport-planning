<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore, AVAILABLE_USERS, type UserId, type UserRole } from "@/stores/user";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import LanguageSelector from "@/components/layout/LanguageSelector.vue";
import { toast } from "vue-sonner";
import { ArrowRight, Boxes, Check, Info, ShieldCheck, Truck } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "vue-i18n";

const router = useRouter();
const userStore = useUserStore();
const { confirm, confirmDialogProps, handleConfirm, handleCancel } = useConfirmDialog();
const { t, tm } = useI18n();

function getRoleLabel(role: UserRole, isFeminine = false): string {
  if (role === 'DISPATCHER') {
    return isFeminine ? t('roles.DISPATCHER.labelFeminine') : t('roles.DISPATCHER.label');
  }
  return isFeminine ? t('roles.LOGISTICS_MANAGER.labelFeminine') : t('roles.LOGISTICS_MANAGER.label');
}

const usersList = computed(() => [
  {
    id: 'diane' as UserId,
    name: AVAILABLE_USERS.diane.name,
    role: AVAILABLE_USERS.diane.role,
    roleLabel: t('roles.DISPATCHER.labelFeminine'),
    description: t('roles.DISPATCHER.description'),
    avatarUrl: AVAILABLE_USERS.diane.avatarUrl,
    initials: AVAILABLE_USERS.diane.initials,
    icon: Truck,
    features: Array.isArray(tm('roles.DISPATCHER.features'))
      ? (tm('roles.DISPATCHER.features') as string[])
      : [t('roles.DISPATCHER.summary')],
  },
  {
    id: 'eric' as UserId,
    name: AVAILABLE_USERS.eric.name,
    role: AVAILABLE_USERS.eric.role,
    roleLabel: t('roles.LOGISTICS_MANAGER.label'),
    description: t('roles.LOGISTICS_MANAGER.description'),
    avatarUrl: AVAILABLE_USERS.eric.avatarUrl,
    initials: AVAILABLE_USERS.eric.initials,
    icon: ShieldCheck,
    features: Array.isArray(tm('roles.LOGISTICS_MANAGER.features'))
      ? (tm('roles.LOGISTICS_MANAGER.features') as string[])
      : [t('roles.LOGISTICS_MANAGER.summary')],
  },
]);

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
  <div class="min-h-screen bg-Msurfacesurfacesecondary text-foreground flex flex-col justify-between p-6 sm:p-10 selection:bg-neutral-200 dark:selection:bg-neutral-800">
    <!-- Top bar Notion-style -->
    <header class="w-full max-w-4xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <Boxes class="h-7 w-auto text-Mmaincolorgreen shrink-0" />
        <div class="flex items-center gap-2 text-xs">
          <span class="font-bold text-foreground text-sm tracking-tight">{{ t('app.title') }}</span>
          <span class="text-muted-foreground/40">/</span>
          <span class="text-muted-foreground font-medium">{{ t('app.subtitle') }}</span>
        </div>
      </div>

      <LanguageSelector />
    </header>

    <!-- Main Content -->
    <main class="my-auto w-full max-w-3xl mx-auto py-10 flex flex-col items-center text-center">
      <!-- Badge subtil Notion -->
      <div class="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-4">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        <span class="font-medium">{{ t('app.portalTitle') }}</span>
      </div>

      <!-- Titre & Sous-titre -->
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        {{ t('app.portalSubtitle') }}
      </h1>
      <p class="mt-2.5 text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
        {{ t('app.portalDescription') }}
      </p>

      <!-- Cartes de profils Notion -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full text-left">
        <div
          v-for="user in usersList"
          :key="user.id"
          @click="selectUser(user.id)"
          class="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all duration-150 hover:border-foreground/40 hover:bg-muted/20 cursor-pointer shadow-none"
        >
          <div>
            <!-- Header carte : Avatar + Badge rôle -->
            <div class="flex items-start justify-between gap-3">
              <Avatar class="h-12 w-12 rounded-xl border border-border bg-muted/30 shrink-0">
                <AvatarImage :src="user.avatarUrl" :alt="user.name" />
                <AvatarFallback class="rounded-xl text-sm font-semibold text-foreground">
                  {{ user.initials }}
                </AvatarFallback>
              </Avatar>

              <div class="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/60 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                <component :is="user.icon" class="h-3 w-3" />
                <span>{{ user.role }}</span>
              </div>
            </div>

            <!-- Nom & rôle -->
            <div class="mt-4">
              <h2 class="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {{ user.name }}
              </h2>
              <p class="text-xs font-medium text-muted-foreground mt-0.5">
                {{ user.roleLabel }}
              </p>
              <p class="mt-2.5 text-xs text-muted-foreground/80 leading-relaxed min-h-9">
                {{ user.description }}
              </p>
            </div>

            <!-- Liste des fonctionnalités / prérogatives -->
            <div class="mt-5 pt-4 border-t border-border/60 space-y-2">
              <div
                v-for="(feat, idx) in user.features"
                :key="idx"
                class="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <Check class="h-3.5 w-3.5 mt-0.5 text-muted-foreground/70 shrink-0" />
                <span class="leading-snug">{{ feat }}</span>
              </div>
            </div>
          </div>

          <!-- Bouton d'accès -->
          <div class="mt-6 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              class="w-full justify-between h-9 text-xs font-medium rounded-lg group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all cursor-pointer"
              @click.stop="selectUser(user.id)"
            >
              <span>{{ t('users.accessAs', { name: user.name }) }}</span>
              <ArrowRight class="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Note informative -->
      <div class="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Info class="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span>{{ t('app.footerSwitchNote') }}</span>
      </div>
    </main>

    <!-- Footer minimaliste -->
    <footer class="w-full max-w-4xl mx-auto text-center py-4 text-[11px] text-muted-foreground/60">
      <span>Afrikedge Logistics Planning System</span>
    </footer>

    <!-- Dialogue de confirmation de session -->
    <ConfirmDialog
      v-bind="confirmDialogProps"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>
