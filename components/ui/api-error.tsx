/**
 * API Error Display Components
 * Specialized components for displaying API errors with appropriate messaging
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  WifiOff,
  Clock,
  Lock,
  CreditCard,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { APIErrorType } from '@/lib/api/client';
import { authService } from '@/lib/services/auth.service';

interface APIErrorDisplayProps {
  errorType?: APIErrorType;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function APIErrorDisplay({
  errorType = APIErrorType.UNKNOWN,
  message,
  onRetry,
  retryLabel = 'Try Again',
}: APIErrorDisplayProps) {
  const getErrorConfig = () => {
    switch (errorType) {
      case APIErrorType.NETWORK:
        return {
          icon: WifiOff,
          title: 'Network Error',
          variant: 'destructive' as const,
          description: 'Please check your internet connection and try again.',
          action: onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-2" />
              {retryLabel}
            </Button>
          ) : null,
        };

      case APIErrorType.TIMEOUT:
        return {
          icon: Clock,
          title: 'Request Timeout',
          variant: 'destructive' as const,
          description: 'The request took too long to complete. Please try again.',
          action: onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-2" />
              {retryLabel}
            </Button>
          ) : null,
        };

      case APIErrorType.AUTH:
        return {
          icon: Lock,
          title: 'Authentication Required',
          variant: 'destructive' as const,
          description: 'Your session has expired. Please log in again.',
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                authService.logout();
                window.location.href = '#/auth';
              }}
            >
              <Lock className="h-3 w-3 mr-2" />
              Log In
            </Button>
          ),
        };

      case APIErrorType.CREDITS:
        return {
          icon: CreditCard,
          title: 'Insufficient Credits',
          variant: 'destructive' as const,
          description: 'You don\'t have enough credits to perform this action.',
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = '#/billing')}
            >
              <CreditCard className="h-3 w-3 mr-2" />
              Get Credits
            </Button>
          ),
        };

      case APIErrorType.RATE_LIMIT:
        return {
          icon: Clock,
          title: 'Rate Limit Exceeded',
          variant: 'default' as const,
          description: 'You\'ve made too many requests. Please wait a moment and try again.',
          action: null,
        };

      case APIErrorType.VALIDATION:
        return {
          icon: AlertCircle,
          title: 'Validation Error',
          variant: 'destructive' as const,
          description: 'Please check your input and try again.',
          action: null,
        };

      case APIErrorType.SERVER:
        return {
          icon: AlertTriangle,
          title: 'Server Error',
          variant: 'destructive' as const,
          description: 'Our servers are experiencing issues. Please try again later.',
          action: onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-2" />
              {retryLabel}
            </Button>
          ) : null,
        };

      default:
        return {
          icon: AlertCircle,
          title: 'Error',
          variant: 'destructive' as const,
          description: 'An unexpected error occurred.',
          action: onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-2" />
              {retryLabel}
            </Button>
          ) : null,
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="my-4">
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{config.description}</p>
        {message && message !== config.description && (
          <p className="text-xs opacity-80 font-mono">{message}</p>
        )}
        {config.action && <div className="mt-3">{config.action}</div>}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline error display (smaller, for forms)
 */
export function InlineAPIError({
  errorType: _errorType,
  message,
}: {
  errorType?: APIErrorType;
  message: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Offline warning banner
 */
export function OfflineBanner() {
  return (
    <div className="bg-yellow-500/10 border-yellow-500/20 border-y px-4 py-3">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            You're currently offline
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-0.5">
            Some features may not be available until your connection is restored.
          </p>
        </div>
      </div>
    </div>
  );
}
