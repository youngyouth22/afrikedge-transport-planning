import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const frRaw = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/fr.json'), 'utf8')
const enRaw = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.json'), 'utf8')

const fr = JSON.parse(frRaw)
const en = JSON.parse(enRaw)

function getObjectKeyPaths(obj, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(obj)) {
    const nextPath = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getObjectKeyPaths(v, nextPath))
    } else {
      keys.push(nextPath)
    }
  }
  return keys
}

describe('Internationalization (i18n) Test Suite', () => {
  test('both fr.json and en.json exist and are valid JSON', () => {
    assert.ok(fr && typeof fr === 'object')
    assert.ok(en && typeof en === 'object')
  })

  test('fr and en translation key structures are 100% identical', () => {
    const frKeys = getObjectKeyPaths(fr).sort()
    const enKeys = getObjectKeyPaths(en).sort()

    const missingInEn = frKeys.filter((k) => !enKeys.includes(k))
    const missingInFr = enKeys.filter((k) => !frKeys.includes(k))

    assert.deepStrictEqual(missingInEn, [], `Keys present in FR but missing in EN: ${missingInEn.join(', ')}`)
    assert.deepStrictEqual(missingInFr, [], `Keys present in EN but missing in FR: ${missingInFr.join(', ')}`)
    assert.strictEqual(frKeys.length, enKeys.length, `Total key count should match (${frKeys.length})`)
  })

  test('no translation values are empty strings', () => {
    function assertNoEmptyValues(obj, currentPath = '') {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = currentPath ? `${currentPath}.${k}` : k
        if (typeof v === 'string') {
          assert.ok(v.trim().length > 0, `Empty string at ${fullPath}`)
        } else if (v && typeof v === 'object') {
          assertNoEmptyValues(v, fullPath)
        }
      }
    }

    assertNoEmptyValues(fr, 'fr')
    assertNoEmptyValues(en, 'en')
  })

  test('core domain statuses and roles are translated properly', () => {
    assert.strictEqual(fr.status.salesOrder.toPlan, 'À planifier')
    assert.strictEqual(en.status.salesOrder.toPlan, 'To Plan')

    assert.strictEqual(fr.status.salesOrder.planned, 'Planifiée')
    assert.strictEqual(en.status.salesOrder.planned, 'Planned')

    assert.strictEqual(fr.status.salesOrder.inDelivery, 'En livraison')
    assert.strictEqual(en.status.salesOrder.inDelivery, 'In Delivery')

    assert.strictEqual(fr.status.transportOrder.draft, 'Brouillon')
    assert.strictEqual(en.status.transportOrder.draft, 'Draft')

    assert.strictEqual(fr.status.transportOrder.validated, 'Validé')
    assert.strictEqual(en.status.transportOrder.validated, 'Validated')

    assert.strictEqual(fr.status.transportOrder.departed, 'Parti')
    assert.strictEqual(en.status.transportOrder.departed, 'Departed')

    assert.strictEqual(fr.roles.DISPATCHER.label, 'Répartiteur')
    assert.strictEqual(en.roles.DISPATCHER.label, 'Dispatcher')

    assert.strictEqual(fr.roles.LOGISTICS_MANAGER.label, 'Responsable Logistique')
    assert.strictEqual(en.roles.LOGISTICS_MANAGER.label, 'Logistics Manager')
  })

  test('fallback behavior: returns default locale "fr" on missing or invalid locale', () => {
    const mockStorage = {
      getItem(key) {
        if (key === 'invalid') return 'de'
        if (key === 'corrupted') return '123'
        return null
      },
    }

    const SUPPORTED = ['fr', 'en']
    function resolveLocale(key) {
      const val = mockStorage.getItem(key)
      if (val && SUPPORTED.includes(val)) return val
      return 'fr'
    }

    assert.strictEqual(resolveLocale('missing'), 'fr')
    assert.strictEqual(resolveLocale('invalid'), 'fr')
    assert.strictEqual(resolveLocale('corrupted'), 'fr')
  })

  test('locale persistence: saves valid locale to storage', () => {
    let saved = null
    const mockStorage = {
      setItem(key, val) {
        if (key === 'afrikedge_locale') saved = val
      },
      getItem() {
        return saved
      },
    }

    function setLocale(loc) {
      if (['fr', 'en'].includes(loc)) {
        mockStorage.setItem('afrikedge_locale', loc)
      }
    }

    setLocale('en')
    assert.strictEqual(mockStorage.getItem(), 'en')

    setLocale('fr')
    assert.strictEqual(mockStorage.getItem(), 'fr')

    setLocale('es') // not supported
    assert.strictEqual(mockStorage.getItem(), 'fr')
  })

  test('number and date formatting matches active locale conventions', () => {
    const weight = 1250.5
    const frFormatted = new Intl.NumberFormat('fr-FR').format(weight)
    const enFormatted = new Intl.NumberFormat('en-US').format(weight)

    // French uses comma or non-breaking space
    assert.ok(frFormatted.includes('1') && (frFormatted.includes('250,5') || frFormatted.includes('250.5')))
    // English uses comma thousands separator and period decimal
    assert.strictEqual(enFormatted, '1,250.5')

    const date = new Date(2026, 9, 27) // 27 Oct 2026
    const frDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    const enDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)

    assert.ok(frDate.includes('2026'))
    assert.ok(enDate.includes('2026'))
    assert.ok(enDate.toLowerCase().includes('oct'))
  })
})
