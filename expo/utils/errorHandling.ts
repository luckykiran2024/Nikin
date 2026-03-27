import { Alert, Platform } from 'react-native';
import { logger } from './logger';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  context?: Record<string, any>;
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  KYC_ERROR: 'KYC_ERROR',
  SHIPMENT_ERROR: 'SHIPMENT_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.NETWORK_ERROR]: 'Please check your internet connection and try again.',
  [ErrorCodes.AUTH_ERROR]: 'Authentication failed. Please log in again.',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check the information you entered.',
  [ErrorCodes.NOT_FOUND]: 'The requested item was not found.',
  [ErrorCodes.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorCodes.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCodes.PAYMENT_ERROR]: 'Payment processing failed. Please try again.',
  [ErrorCodes.KYC_ERROR]: 'KYC verification failed. Please check your documents.',
  [ErrorCodes.SHIPMENT_ERROR]: 'Shipment operation failed. Please try again.',
};

export const createAppError = (
  code: ErrorCode,
  message: string,
  context?: Record<string, any>
): AppError => ({
  code,
  message,
  userMessage: errorMessages[code] || errorMessages[ErrorCodes.UNKNOWN_ERROR],
  recoverable: code !== ErrorCodes.AUTH_ERROR,
  context,
});

export const parseError = (error: unknown): AppError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return createAppError(ErrorCodes.NETWORK_ERROR, error.message);
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
      return createAppError(ErrorCodes.AUTH_ERROR, error.message);
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return createAppError(ErrorCodes.NOT_FOUND, error.message);
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return createAppError(ErrorCodes.VALIDATION_ERROR, error.message);
    }
    
    if (message.includes('permission') || message.includes('forbidden') || message.includes('403')) {
      return createAppError(ErrorCodes.PERMISSION_DENIED, error.message);
    }
    
    if (message.includes('payment')) {
      return createAppError(ErrorCodes.PAYMENT_ERROR, error.message);
    }
    
    if (message.includes('kyc')) {
      return createAppError(ErrorCodes.KYC_ERROR, error.message);
    }
    
    if (message.includes('shipment')) {
      return createAppError(ErrorCodes.SHIPMENT_ERROR, error.message);
    }
    
    return createAppError(ErrorCodes.UNKNOWN_ERROR, error.message);
  }
  
  if (typeof error === 'string') {
    return createAppError(ErrorCodes.UNKNOWN_ERROR, error);
  }
  
  return createAppError(ErrorCodes.UNKNOWN_ERROR, 'An unknown error occurred');
};

export const handleError = (
  error: unknown,
  context: string,
  showAlert: boolean = true
): AppError => {
  const appError = parseError(error);
  
  logger.error(context, appError.message, {
    code: appError.code,
    context: appError.context,
    originalError: error,
  });
  
  if (showAlert && Platform.OS !== 'web') {
    Alert.alert(
      'Error',
      appError.userMessage,
      [{ text: 'OK' }]
    );
  }
  
  return appError;
};

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  options: { showAlert?: boolean; rethrow?: boolean } = {}
): Promise<T | null> => {
  const { showAlert = true, rethrow = false } = options;
  
  try {
    return await operation();
  } catch (error) {
    const appError = handleError(error, context, showAlert);
    
    if (rethrow) {
      throw appError;
    }
    
    return null;
  }
};

export const isNetworkError = (error: unknown): boolean => {
  const appError = parseError(error);
  return appError.code === ErrorCodes.NETWORK_ERROR;
};

export const isAuthError = (error: unknown): boolean => {
  const appError = parseError(error);
  return appError.code === ErrorCodes.AUTH_ERROR;
};
