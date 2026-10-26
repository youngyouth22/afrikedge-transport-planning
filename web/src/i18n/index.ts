import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

export const SUPPORTED_LOCALES = ['fr', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'fr'
export const STORAGE_KEY_LOCALE = 'afrikedge_locale'

/**
 * Validates and retrieves the persisted locale from localStorage.
 * Falls back safely to DEFAULT_LOCALE ('fr') if missing or invalid.
 */
export function getSavedLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCALE)
    if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
      return saved as SupportedLocale
    }
  } catch {
    // localStorage may be inaccessible (private browsing / disabled)
  }
  return DEFAULT_LOCALE
}

const initialLocale = getSavedLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    fr,
    en,
  },
})

// Synchronize <html lang="..."> attribute on initial load
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLocale
}

/**
 * Switch the application locale immediately without reloading the page.
 * Persists the choice in localStorage and updates the DOM html lang attribute.
 */
export function setAppLocale(locale: SupportedLocale): void {
  if (!SUPPORTED_LOCALES.includes(locale)) return

  // In vue-i18n Composition API (legacy: false), locale is a ref
  if (typeof i18n.global.locale === 'object' && 'value' in i18n.global.locale) {
    i18n.global.locale.value = locale
  }

  try {
    localStorage.setItem(STORAGE_KEY_LOCALE, locale)
  } catch {
    // safe fallback if localStorage fails
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

/**
 * Format a number using the active locale.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  const currentLocale = getCurrentLocale()
  const intlLocale = currentLocale === 'en' ? 'en-US' : 'fr-FR'
  return new Intl.NumberFormat(intlLocale, options).format(value)
}

/**
 * Format a date string or Date object using the active locale.
 */
export function formatDate(
  value: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  if (!value) return ''
  try {
    let dateObj: Date
    if (typeof value === 'string') {
      const parts = value.split('-').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        dateObj = new Date(parts[0], parts[1] - 1, parts[2])
      } else {
        dateObj = new Date(value)
      }
    } else {
      dateObj = value
    }
    const currentLocale = getCurrentLocale()
    const intlLocale = currentLocale === 'en' ? 'en-US' : 'fr-FR'
    return new Intl.DateTimeFormat(intlLocale, options).format(dateObj)
  } catch {
    return String(value)
  }
}

export function getCurrentLocale(): SupportedLocale {
  if (typeof i18n.global.locale === 'object' && 'value' in i18n.global.locale) {
    return (i18n.global.locale.value as SupportedLocale) || DEFAULT_LOCALE
  }
  return DEFAULT_LOCALE
}

export default i18n
