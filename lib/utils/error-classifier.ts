// Classifies a caught error into one of the canonical error type strings
// so the extension can report accurate error_types to /tasks/[taskId]/finalize.
import type { ErrorType } from '@/lib/constants/error-types';

export function classifyError(err: unknown): ErrorType {
    const raw = err instanceof Error ? err.message : String(err ?? '');
    const msg = raw.toLowerCase();

    // Amazon infrastructure blocks
    if (msg.includes('blocked') || msg.includes('robot') || msg.includes('captcha') || msg.includes('automated')) {
        return 'amazon_blocked';
    }

    // CAPTCHA detected
    if (msg.includes('captcha')) {
        return 'captcha_required';
    }

    // Session / auth expiry
    if (msg.includes('session') && (msg.includes('expired') || msg.includes('invalid') || msg.includes('timeout'))) {
        return 'session_expired';
    }

    // Rate limiting
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
        return 'rate_limited';
    }

    // Server errors
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('server error')) {
        return 'server_error';
    }

    // Network / timeout
    if (
        msg.includes('timeout') ||
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('econnreset') ||
        msg.includes('econnrefused') ||
        msg.includes('etimedout') ||
        msg.includes('aborted')
    ) {
        return 'network_timeout';
    }

    // --- User errors ---

    // Access denied (403 / permission)
    if (msg.includes('access denied') || msg.includes('permission') || msg.includes('403') || msg.includes('forbidden')) {
        return 'access_denied';
    }

    // Invalid / missing ASIN
    if (
        msg.includes('invalid asin') ||
        msg.includes('asin not found') ||
        msg.includes('no results') ||
        msg.includes('product not found') ||
        msg.includes('404')
    ) {
        return 'invalid_asin';
    }

    // Invalid URL
    if (msg.includes('invalid url') || msg.includes('malformed') || msg.includes('url')) {
        return 'invalid_url';
    }

    return 'unknown_error';
}
