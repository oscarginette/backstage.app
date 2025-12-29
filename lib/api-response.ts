/**
 * Standard API Response Types
 *
 * Provides consistent response formatting for all API endpoints.
 * All responses include a success flag and optional request ID for tracking.
 */

import { NextResponse } from 'next/server';

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
  requestId?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Creates a success response with consistent format
 *
 * @param data - The data payload to return
 * @param status - HTTP status code (default: 200)
 * @param requestId - Optional request ID for tracking
 *
 * @example
 * return successResponse({ userId: 123, email: 'user@example.com' });
 * return successResponse({ created: true }, 201, requestId);
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      requestId,
    },
    { status }
  );
}

/**
 * Creates an error response with consistent format
 *
 * @param error - Error message
 * @param code - Error code for client-side handling
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details
 * @param requestId - Optional request ID for tracking
 *
 * @example
 * return errorResponse('User not found', 'USER_NOT_FOUND', 404);
 * return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, { fields: ['email'] });
 */
export function errorResponse(
  error: string,
  code: string,
  status: number = 500,
  details?: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
      requestId,
    },
    { status }
  );
}

/**
 * Creates a paginated success response
 *
 * @param data - Array of items
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param requestId - Optional request ID
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  requestId?: string
): NextResponse<SuccessResponse<PaginatedData<T>>> {
  return successResponse(
    {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    200,
    requestId
  );
}

/**
 * Creates a no-content response (204)
 *
 * Used for successful DELETE operations or updates with no return data.
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Creates a created response (201)
 *
 * Used for successful POST operations that create new resources.
 */
export function createdResponse<T>(
  data: T,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  return successResponse(data, 201, requestId);
}

/**
 * Creates an accepted response (202)
 *
 * Used for async operations that have been accepted but not completed.
 */
export function acceptedResponse<T>(
  data: T,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  return successResponse(data, 202, requestId);
}
