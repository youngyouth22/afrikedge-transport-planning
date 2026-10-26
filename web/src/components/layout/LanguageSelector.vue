<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe, Check } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { setAppLocale, type SupportedLocale } from '@/i18n'

const { locale, t } = useI18n()

const currentLocale = computed(() => locale.value as SupportedLocale)

const languages = [
  {
    code: 'fr' as SupportedLocale,
    name: 'Français',
    shortLabel: 'FR',
    flag: '🇫🇷',
  },
  {
    code: 'en' as SupportedLocale,
    name: 'English',
    shortLabel: 'EN',
    flag: '🇬🇧',
  },
]

function selectLanguage(langCode: SupportedLocale) {
  if (locale.value === langCode) return
  setAppLocale(langCode)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-10 px-3 flex items-center gap-2 rounded-xl border-border bg-background hover:bg-accent text-foreground font-medium cursor-pointer transition-colors shadow-xs"
        :aria-label="t('common.switchLanguage')"
        :title="t('common.switchLanguage')"
      >
        <Globe class="h-4 w-4 text-muted-foreground shrink-0" />
        <span class="text-xs font-bold tracking-wider uppercase">
          {{ currentLocale === 'fr' ? 'FR' : 'EN' }}
        </span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-44 p-1.5 rounded-2xl border-border bg-card shadow-xl z-100">
      <DropdownMenuLabel class="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {{ t('common.language') }}
      </DropdownMenuLabel>
      <DropdownMenuSeparator class="my-1 bg-border" />

      <DropdownMenuItem
        v-for="lang in languages"
        :key="lang.code"
        @click="selectLanguage(lang.code)"
        class="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
        :class="{ 'bg-accent/60 font-semibold text-primary': currentLocale === lang.code }"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-sm leading-none">{{ lang.flag }}</span>
          <span class="text-xs text-foreground">{{ lang.name }}</span>
        </div>
        <Check v-if="currentLocale === lang.code" class="h-3.5 w-3.5 text-primary shrink-0" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
