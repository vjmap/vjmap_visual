import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

export type LocaleId = 'zh' | 'en'

function normalizeLocale(value: string | null | undefined): LocaleId | null {
  if (!value) return null
  const locale = value.toLowerCase()
  if (locale.startsWith('en')) return 'en'
  if (locale.startsWith('zh')) return 'zh'
  return null
}

function getLocaleFromPath(path: string): LocaleId | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (normalizedPath === '/en' || normalizedPath.startsWith('/en/')) {
    return 'en'
  }
  return null
}

export function resolveInitialLocale(): LocaleId {
  const searchParams = new URLSearchParams(window.location.search)
  const hashValue = window.location.hash.replace(/^#/, '')
  const [hashPath = '/', hashQuery = ''] = hashValue.split('?')
  const hashParams = new URLSearchParams(hashQuery)

  const localeFromParams = normalizeLocale(
    searchParams.get('lang')
      ?? searchParams.get('locale')
      ?? hashParams.get('lang')
      ?? hashParams.get('locale'),
  )

  if (localeFromParams) {
    return localeFromParams
  }

  return getLocaleFromPath(hashPath) ?? getLocaleFromPath(window.location.pathname) ?? 'zh'
}

const initialLocale = resolveInitialLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    zh,
    en,
  },
  globalInjection: true,
})

export default i18n
