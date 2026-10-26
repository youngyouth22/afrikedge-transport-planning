import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Stable, machine-readable error codes returned in every business error body.
 * The frontend maps these codes to translated messages, so the human-readable
 * `message` can change without breaking the UI.
 */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'USER_ID_MISSING'
  | 'USER_UNKNOWN'
  | 'ROLE_FORBIDDEN'
  | 'DELIVERY_DATE_IN_PAST'
  | 'VEHICLE_NOT_FOUND'
  | 'VEHICLE_INACTIVE'
  | 'VEHICLE_ALREADY_BOOKED'
  | 'TRANSPORT_NOT_FOUND'
  | 'TRANSPORT_NOT_DRAFT'
  | 'TRANSPORT_NOT_VALIDATED'
  | 'TRANSPORT_EMPTY'
  | 'EMPTY_SELECTION'
  | 'SALES_ORDERS_NOT_FOUND'
  | 'SALES_ORDERS_NOT_TO_PLAN'
  | 'SALES_ORDERS_ALREADY_ASSIGNED'
  | 'CAPACITY_EXCEEDED'
  | 'LINE_NOT_FOUND';

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

const STATUS_LABELS: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
};

export class ApiError extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    const body: ApiErrorBody = {
      statusCode: status,
      error: STATUS_LABELS[status] ?? 'Error',
      code,
      message,
      ...(details ? { details } : {}),
    };
    super(body, status);
  }
}

/*
 * Status code policy:
 *  400 – malformed or invalid input (DTO validation, past date, empty selection)
 *  401 – missing or unknown X-User-Id
 *  403 – known user whose role does not allow the action
 *  404 – referenced resource does not exist
 *  409 – valid request that conflicts with the current state of the data
 *        (lifecycle status, capacity, existing assignment or booking)
 */
export const badRequest = (code: ApiErrorCode, message: string, details?: Record<string, unknown>) =>
  new ApiError(HttpStatus.BAD_REQUEST, code, message, details);

export const unauthorized = (code: ApiErrorCode, message: string, details?: Record<string, unknown>) =>
  new ApiError(HttpStatus.UNAUTHORIZED, code, message, details);

export const forbidden = (code: ApiErrorCode, message: string, details?: Record<string, unknown>) =>
  new ApiError(HttpStatus.FORBIDDEN, code, message, details);

export const notFound = (code: ApiErrorCode, message: string, details?: Record<string, unknown>) =>
  new ApiError(HttpStatus.NOT_FOUND, code, message, details);

export const conflict = (code: ApiErrorCode, message: string, details?: Record<string, unknown>) =>
  new ApiError(HttpStatus.CONFLICT, code, message, details);
