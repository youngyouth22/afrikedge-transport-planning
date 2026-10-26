export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

export class ApiError extends Error {
  readonly statusCode: number;
  override readonly message: string;
  readonly errorCode?: string;
  readonly errorDetails?: unknown;

  constructor(statusCode: number, message: string, errorCode?: string, errorDetails?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const userId = localStorage.getItem('afrikedge_current_user') || 'diane';

  const headers = new Headers(options.headers || {});
  headers.set('X-User-Id', userId);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined = undefined;
    let errorDetails: unknown = undefined;

    try {
      const data = (await response.json()) as ApiErrorResponse;
      errorDetails = data.details ?? data;
      errorCode = data.code;
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      }
    } catch {
      // response wasn't JSON
    }

    throw new ApiError(response.status, errorMessage, errorCode, errorDetails);
  }

  // Si 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
