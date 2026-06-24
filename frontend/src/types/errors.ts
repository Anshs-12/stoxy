export interface ApiErrorResponse {
  success: boolean;
  error: ErrorCode;
  message: string;
  path: string;
  time: string;
}

export type ErrorCode =
  | 'STOCK_NOT_FOUND'
  | 'INDEX_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'INSUFFICIENT_QUANTITY'
  | 'UPSTOX_FEED_ERROR';
