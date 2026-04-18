import { Platform } from 'react-native';
import { logger } from './logger';

type Severity = 'fatal' | 'error' | 'warning' | 'info';

interface Breadcrumb {
  category: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  level: Severity;
}

interface CapturedError {
  id: string;
  message: string;
  stack?: string;
  severity: Severity;
  tags: Record<string, string>;
  extra?: Record<string, unknown>;
  breadcrumbs: Breadcrumb[];
  userId?: string;
  timestamp: string;
  platform: string;
}

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

class ErrorTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private userId: string | undefined;
  private tags: Record<string, string> = {};
  private captured: CapturedError[] = [];
  private maxCaptured = 100;

  setUser(id?: string) {
    this.userId = id;
  }

  setTag(key: string, value: string) {
    this.tags[key] = value;
  }

  addBreadcrumb(crumb: Omit<Breadcrumb, 'timestamp'>) {
    const entry: Breadcrumb = { ...crumb, timestamp: new Date().toISOString() };
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) this.breadcrumbs.shift();
  }

  captureException(error: unknown, context?: { tags?: Record<string, string>; extra?: Record<string, unknown>; severity?: Severity }) {
    const err = error instanceof Error ? error : new Error(String(error));
    const captured: CapturedError = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      message: err.message,
      stack: err.stack,
      severity: context?.severity ?? 'error',
      tags: { ...this.tags, ...(context?.tags ?? {}) },
      extra: context?.extra,
      breadcrumbs: [...this.breadcrumbs],
      userId: this.userId,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };
    this.captured.push(captured);
    if (this.captured.length > this.maxCaptured) this.captured.shift();

    logger.error('ErrorTracker', err.message, err);

    if (SENTRY_DSN) {
      this.forward(captured).catch(e => console.log('[ErrorTracker] forward failed', e));
    }
    return captured.id;
  }

  captureMessage(message: string, severity: Severity = 'info', extra?: Record<string, unknown>) {
    return this.captureException(new Error(message), { severity, extra });
  }

  private async forward(captured: CapturedError) {
    try {
      await fetch(SENTRY_DSN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(captured),
      });
    } catch (e) {
      console.log('[ErrorTracker] forward error', e);
    }
  }

  getRecent(limit = 20): CapturedError[] {
    return this.captured.slice(-limit).reverse();
  }

  clear() {
    this.captured = [];
    this.breadcrumbs = [];
  }
}

export const errorTracker = new ErrorTracker();

export function installGlobalErrorHandlers() {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as any;
    if (!g.__rork_error_handlers_installed) {
      g.__rork_error_handlers_installed = true;

      if (typeof g.ErrorUtils !== 'undefined' && g.ErrorUtils.setGlobalHandler) {
        const prev = g.ErrorUtils.getGlobalHandler?.();
        g.ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
          errorTracker.captureException(error, { severity: isFatal ? 'fatal' : 'error', tags: { source: 'global' } });
          prev?.(error, isFatal);
        });
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.addEventListener('error', (e) => {
          errorTracker.captureException(e.error ?? e.message, { tags: { source: 'window.error' } });
        });
        window.addEventListener('unhandledrejection', (e) => {
          errorTracker.captureException((e as PromiseRejectionEvent).reason, { tags: { source: 'unhandledrejection' } });
        });
      }
    }
  }
}
