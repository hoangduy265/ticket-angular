import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SecurityService } from './security.service';
import { environment } from '../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const securityService = this.injector.get(SecurityService);

    // Log error securely
    this.logErrorSecurely(error, securityService);

    // Don't expose error details in production
    if (environment.production) {
      console.error('An error occurred. Please try again later.');
    } else {
      // Show full error in development
      console.error('Error:', error);
    }

    // Send error to monitoring service (if implemented)
    this.reportError(error);
  }

  /**
   * Log error securely without exposing sensitive information
   */
  private logErrorSecurely(error: any, securityService: SecurityService): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorType: this.getErrorType(error),
      errorMessage: this.sanitizeErrorMessage(error),
      stackTrace: environment.production ? 'REDACTED' : this.getStackTrace(error),
      userId: this.getCurrentUserId(),
    };

    // Hash sensitive data
    if (errorInfo.userId) {
      errorInfo.userId = securityService.hashData(errorInfo.userId);
    }

    console.log('Secure Error Log:', errorInfo);
  }

  /**
   * Get error type
   */
  private getErrorType(error: any): string {
    if (error instanceof HttpErrorResponse) {
      return 'HTTP_ERROR';
    }
    if (error instanceof TypeError) {
      return 'TYPE_ERROR';
    }
    if (error instanceof ReferenceError) {
      return 'REFERENCE_ERROR';
    }
    if (error instanceof SyntaxError) {
      return 'SYNTAX_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Sanitize error message to remove sensitive information
   */
  private sanitizeErrorMessage(error: any): string {
    let message = error.message || error.toString();

    // Remove potential sensitive data patterns
    message = message.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CREDIT_CARD_REDACTED]');
    message = message.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL_REDACTED]'
    );
    message = message.replace(/\b\d{10,15}\b/g, '[PHONE_REDACTED]');
    message = message.replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]');
    message = message.replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]');
    message = message.replace(/apikey[=:]\s*\S+/gi, 'apikey=[REDACTED]');

    return message;
  }

  /**
   * Get stack trace safely
   */
  private getStackTrace(error: any): string {
    if (error.stack) {
      // Remove absolute file paths that might contain sensitive info
      return error.stack.replace(/file:\/\/[^\s)]+/g, '[FILE_PATH_REDACTED]');
    }
    return 'No stack trace available';
  }

  /**
   * Get current user ID (if available)
   */
  private getCurrentUserId(): string | null {
    try {
      // Try to get user ID from localStorage/sessionStorage
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.userId || null;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: any): void {
    // TODO: Implement error reporting to services like:
    // - Sentry
    // - LogRocket
    // - Firebase Crashlytics
    // - Custom monitoring endpoint

    if (environment.production) {
      // Only report in production
      this.sendErrorToMonitoring(error);
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendErrorToMonitoring(error: any): void {
    const monitoringEndpoint = '/api/errors'; // Your monitoring endpoint

    const errorReport = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: this.sanitizeErrorMessage(error),
      type: this.getErrorType(error),
      url: window.location.href,
      userAgent: navigator.userAgent,
      // Don't include stack trace in production reports
    };

    // Send via navigator.sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(monitoringEndpoint, JSON.stringify(errorReport));
    } else {
      // Fallback to fetch
      fetch(monitoringEndpoint, {
        method: 'POST',
        body: JSON.stringify(errorReport),
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore reporting errors to avoid infinite loops
      });
    }
  }
}
