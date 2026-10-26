import { i18n } from '@/i18n'
import { ApiError } from '@/api/client'

/**
 * Translates an API or runtime error into a localized, user-friendly message.
 * Maps known backend error phrases and HTTP status codes to active locale translation keys.
 * Preserves safe server message details for unknown errors without exposing stack traces.
 */
export function getLocalizedErrorMessage(err: unknown): string {
  const t = i18n.global.t

  if (!err) {
    return t('errors.default')
  }

  // Network / fetch failures
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return t('errors.network')
  }

  const rawMessage =
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : ''

  // 1. Precise machine-readable error codes from backend ApiError
  if (err instanceof ApiError && err.errorCode) {
    const details = (err.errorDetails as Record<string, any>) || {}
    switch (err.errorCode) {
      case 'TRANSPORT_NOT_FOUND':
        return t('errors.transportNotFound', { no: details.no || '?' })
      case 'VEHICLE_NOT_FOUND':
        return t('errors.vehicleNotFound', { code: details.vehicleCode || '?' })
      case 'VEHICLE_INACTIVE':
        return t('errors.vehicleInactive')
      case 'DELIVERY_DATE_IN_PAST':
        return t('errors.deliveryDateInPast')
      case 'VEHICLE_ALREADY_BOOKED':
        return t('errors.vehicleAlreadyBooked')
      case 'TRANSPORT_EMPTY':
        return t('errors.emptyTransportCannotValidate')
      case 'ROLE_FORBIDDEN':
        return t('errors.onlyLogisticsManagerCanValidate')
      case 'TRANSPORT_NOT_DRAFT':
        return t('errors.onlyDraftCanBeModified')
      case 'TRANSPORT_NOT_VALIDATED':
        return t('errors.onlyValidatedCanDepart')
      case 'SALES_ORDERS_ALREADY_ASSIGNED': {
        const nos = Array.isArray(details.salesOrderNos) ? details.salesOrderNos.join(', ') : '?'
        return t('errors.orderAlreadyAssigned', { no: nos })
      }
      case 'SALES_ORDERS_NOT_TO_PLAN': {
        const nos = Array.isArray(details.salesOrderNos) ? details.salesOrderNos.join(', ') : '?'
        return t('errors.orderNotInStatusToPlan', { no: nos })
      }
      case 'LINE_NOT_FOUND':
        return t('errors.orderLineNotFound', {
          salesOrderNo: details.salesOrderNo || '?',
          transportNo: details.transportNo || '?',
        })
      case 'CAPACITY_EXCEEDED':
        return t('errors.capacityExceeded', {
          weight: details.totalWeightKg ?? '?',
          capacity: details.capacityKg ?? '?',
        })
      case 'USER_ID_MISSING':
      case 'USER_UNKNOWN':
        return t('errors.unauthorized')
    }
  }

  const lower = rawMessage.toLowerCase()

  // 2. Specific backend business rule regex/string patterns (for string or un-coded errors)
  const transportNotFoundMatch = rawMessage.match(/Ordre de transport ["']([^"']+)["'] introuvable/i)
  if (transportNotFoundMatch) {
    return t('errors.transportNotFound', { no: transportNotFoundMatch[1] })
  }

  const vehicleNotFoundMatch = rawMessage.match(/V[ée]hicule ["']([^"']+)["'] introuvable/i)
  if (vehicleNotFoundMatch) {
    return t('errors.vehicleNotFound', { code: vehicleNotFoundMatch[1] })
  }

  if (lower.includes('inactif')) {
    return t('errors.vehicleInactive')
  }

  if (lower.includes('passé') || lower.includes('past')) {
    return t('errors.deliveryDateInPast')
  }

  if (lower.includes('déjà un transport') || lower.includes('already has a transport') || lower.includes('un seul ordre par date')) {
    return t('errors.vehicleAlreadyBooked')
  }

  if (lower.includes('au moins une commande') || lower.includes('at least one')) {
    return t('errors.emptyTransportCannotValidate')
  }

  if (lower.includes('responsable logistique') || lower.includes('logistics_manager') || lower.includes('seul le responsable')) {
    return t('errors.onlyLogisticsManagerCanValidate')
  }

  if (lower.includes('brouillon') && (lower.includes('seul') || lower.includes('uniquement') || lower.includes('un ordre validé ne peut'))) {
    return t('errors.onlyDraftCanBeModified')
  }

  if (lower.includes('départ') && lower.includes('validé')) {
    return t('errors.onlyValidatedCanDepart')
  }

  const orderAlreadyAssignedMatch = rawMessage.match(/commande ["']?([^"' ]+)["']? est d[ée]j[àa] affect[ée]e/i)
  if (orderAlreadyAssignedMatch) {
    return t('errors.orderAlreadyAssigned', { no: orderAlreadyAssignedMatch[1] })
  }

  const orderNotInPlanMatch = rawMessage.match(/commande ["']?([^"' ]+)["']? n'est pas au statut/i)
  if (orderNotInPlanMatch) {
    return t('errors.orderNotInStatusToPlan', { no: orderNotInPlanMatch[1] })
  }

  if (lower.includes('dépasse la capacité') || lower.includes('capacit') && lower.includes('dépass')) {
    return t('errors.capacityExceeded', { weight: '?', capacity: '?' })
  }

  // 2. HTTP Status Code fallbacks for ApiError
  if (err instanceof ApiError) {
    if (err.statusCode === 403) return t('errors.forbidden')
    if (err.statusCode === 404) return t('errors.notFound')
    if (err.statusCode === 409) return t('errors.conflict')
    if (err.statusCode === 401) return t('errors.unauthorized')
  }

  // 3. Fallback safe error message (stripping SQL / stack trace keywords)
  if (rawMessage) {
    const isPotentiallySensitive =
      lower.includes('select ') ||
      lower.includes('insert ') ||
      lower.includes('update ') ||
      lower.includes('delete from') ||
      lower.includes('mssql') ||
      lower.includes('sql server') ||
      lower.includes('stack trace') ||
      lower.includes('at ') && lower.includes('.ts:')

    if (!isPotentiallySensitive) {
      return rawMessage
    }
  }

  return t('errors.default')
}
