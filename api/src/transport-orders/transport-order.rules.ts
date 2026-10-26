import type { UserContext } from '../auth/auth.guard.js';
import { UserRole } from '../auth/auth.guard.js';
import { badRequest, conflict, forbidden, notFound } from '../common/api-error.js';

/** Status codes stored in the database. Never change these values. */
export const TransportOrderStatus = {
  DRAFT: 0,
  VALIDATED: 1,
  DEPARTED: 2,
} as const;

export const SalesOrderStatus = {
  TO_PLAN: 0,
  PLANNED: 1,
  IN_DELIVERY: 2,
} as const;

export interface SalesOrderSnapshot {
  no: string;
  status: number;
  totalWeightKg: number;
}

/** Formats a Date as YYYY-MM-DD in the server's local time zone. */
export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Rule: a transport order cannot be created for a past delivery date (today is allowed). */
export function assertDeliveryDateNotPast(deliveryDate: string, now: Date): void {
  // Both values are YYYY-MM-DD, so lexical comparison is chronological.
  if (deliveryDate < toLocalIsoDate(now)) {
    throw badRequest(
      'DELIVERY_DATE_IN_PAST',
      'La date de livraison ne peut pas être dans le passé.',
      { deliveryDate },
    );
  }
}

/** Rule: only an existing, active vehicle can be used. */
export function assertVehicleUsable(
  vehicleCode: string,
  vehicle: { active: boolean } | undefined,
): void {
  if (!vehicle) {
    throw notFound('VEHICLE_NOT_FOUND', `Véhicule "${vehicleCode}" introuvable.`, { vehicleCode });
  }
  if (!vehicle.active) {
    throw conflict('VEHICLE_INACTIVE', `Le véhicule "${vehicleCode}" est hors service.`, {
      vehicleCode,
    });
  }
}

/** Rule: adding or removing sales orders is only allowed on a draft. */
export function assertTransportIsDraft(transportNo: string, status: number): void {
  if (status !== TransportOrderStatus.DRAFT) {
    throw conflict(
      'TRANSPORT_NOT_DRAFT',
      `L'ordre de transport "${transportNo}" n'est plus au statut Brouillon et ne peut plus être modifié.`,
      { transportNo, status },
    );
  }
}

/**
 * Trims and de-duplicates the requested sales order numbers.
 * Rule: a bulk assignment must contain at least one order.
 */
export function normalizeSalesOrderNos(salesOrderNos: readonly string[]): string[] {
  const unique = Array.from(new Set(salesOrderNos.map((no) => no.trim()).filter(Boolean)));
  if (unique.length === 0) {
    throw badRequest('EMPTY_SELECTION', 'Veuillez sélectionner au moins une commande de vente.');
  }
  return unique;
}

/**
 * Rules: every requested order must exist, be "to plan" (status 0) and not already
 * belong to a transport. The whole selection is rejected if any order fails, which
 * is what makes bulk assignment all-or-nothing.
 */
export function assertSalesOrdersAssignable(
  requestedNos: readonly string[],
  found: readonly SalesOrderSnapshot[],
  alreadyAssignedNos: readonly string[],
): void {
  const foundNos = new Set(found.map((order) => order.no));
  const missing = requestedNos.filter((no) => !foundNos.has(no));
  if (missing.length > 0) {
    throw notFound(
      'SALES_ORDERS_NOT_FOUND',
      `Commande(s) introuvable(s) : ${missing.join(', ')}.`,
      { salesOrderNos: missing },
    );
  }

  const notToPlan = found
    .filter((order) => order.status !== SalesOrderStatus.TO_PLAN)
    .map((order) => order.no);
  if (notToPlan.length > 0) {
    throw conflict(
      'SALES_ORDERS_NOT_TO_PLAN',
      `Commande(s) qui ne sont pas au statut À planifier : ${notToPlan.join(', ')}.`,
      { salesOrderNos: notToPlan },
    );
  }

  if (alreadyAssignedNos.length > 0) {
    throw conflict(
      'SALES_ORDERS_ALREADY_ASSIGNED',
      `Commande(s) déjà affectée(s) à un ordre de transport : ${alreadyAssignedNos.join(', ')}.`,
      { salesOrderNos: [...alreadyAssignedNos] },
    );
  }
}

/** Weights are decimal(10,2); compare in hundredths of a kg to avoid float drift. */
const toHundredths = (kg: number): number => Math.round(kg * 100);

export function sumWeightsKg(weights: readonly number[]): number {
  return weights.reduce((total, kg) => total + toHundredths(kg), 0) / 100;
}

/**
 * Rule: the total weight of a transport must never exceed the vehicle capacity.
 * Filling the vehicle exactly to capacity is allowed.
 * @returns the new total weight in kg
 */
export function assertWithinCapacity(
  currentWeightKg: number,
  additionalWeightKg: number,
  capacityKg: number,
): number {
  const newTotalHundredths = toHundredths(currentWeightKg) + toHundredths(additionalWeightKg);
  const capacityHundredths = toHundredths(capacityKg);
  const newTotalWeightKg = newTotalHundredths / 100;

  if (newTotalHundredths > capacityHundredths) {
    const excessKg = (newTotalHundredths - capacityHundredths) / 100;
    throw conflict(
      'CAPACITY_EXCEEDED',
      `Le poids total (${newTotalWeightKg} kg) dépasserait la capacité du véhicule (${capacityKg} kg) de ${excessKg} kg.`,
      { totalWeightKg: newTotalWeightKg, capacityKg, excessKg },
    );
  }

  return newTotalWeightKg;
}

/** Rule: only a LOGISTICS_MANAGER may validate. */
export function assertCanValidateRole(user: UserContext): void {
  if (user.role !== UserRole.LOGISTICS_MANAGER) {
    throw forbidden(
      'ROLE_FORBIDDEN',
      'Seul un LOGISTICS_MANAGER peut valider un ordre de transport.',
      { requiredRole: UserRole.LOGISTICS_MANAGER, currentRole: user.role },
    );
  }
}

/** Rules: only a draft with at least one sales order can be validated. */
export function assertCanValidate(transportNo: string, status: number, lineCount: number): void {
  if (status !== TransportOrderStatus.DRAFT) {
    throw conflict(
      'TRANSPORT_NOT_DRAFT',
      `Seul un ordre au statut Brouillon peut être validé ("${transportNo}").`,
      { transportNo, status },
    );
  }
  if (lineCount === 0) {
    throw conflict(
      'TRANSPORT_EMPTY',
      'Un ordre de transport doit contenir au moins une commande pour être validé.',
      { transportNo },
    );
  }
}

/** Rule: only a validated transport order can depart. */
export function assertCanDepart(transportNo: string, status: number): void {
  if (status !== TransportOrderStatus.VALIDATED) {
    throw conflict(
      'TRANSPORT_NOT_VALIDATED',
      `Seul un ordre validé peut être marqué comme parti ("${transportNo}").`,
      { transportNo, status },
    );
  }
}

/**
 * Computes the next "TO-NNNN" number from the highest numeric suffix in use.
 * Using the numeric value (not string MAX) keeps ordering correct past TO-9999.
 */
export function nextTransportOrderNo(maxNumericSuffix: number | null): string {
  const next = (maxNumericSuffix ?? 0) + 1;
  return `TO-${String(next).padStart(4, '0')}`;
}
