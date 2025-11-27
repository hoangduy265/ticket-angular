import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  constructor() {
    this.initializeSecurity();
  }

  /**
   * Khởi tạo các biện pháp bảo mật
   */
  private initializeSecurity(): void {
    if (environment.security.enableCSP) {
      this.setContentSecurityPolicy();
    }

    if (environment.security.enableHSTS) {
      this.setStrictTransportSecurity();
    }

    if (environment.security.enableXFrameOptions) {
      this.setXFrameOptions();
    }

    if (environment.security.enableContentTypeOptions) {
      this.setContentTypeOptions();
    }

    if (environment.security.enableReferrerPolicy) {
      this.setReferrerPolicy();
    }

    if (environment.security.enablePermissionsPolicy) {
      this.setPermissionsPolicy();
    }
  }

  /**
   * Thiết lập Content Security Policy
   */
  private setContentSecurityPolicy(): void {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://www.recaptcha.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebaseinstallations.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://firestore.googleapis.com https://www.google-analytics.com https://www.google.com https://api.hoangduy.info",
      "frame-src 'self' https://www.google.com https://www.recaptcha.net https://www.youtube.com https://www.youtube-nocookie.com",
      "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ');

    // Thêm CSP header via meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
  }

  /**
   * Thiết lập HTTP Strict Transport Security
   */
  private setStrictTransportSecurity(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Strict-Transport-Security';
    meta.content = 'max-age=31536000; includeSubDomains; preload';
    document.head.appendChild(meta);
  }

  /**
   * Thiết lập X-Frame-Options
   */
  private setXFrameOptions(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Frame-Options';
    meta.content = 'DENY';
    document.head.appendChild(meta);
  }

  /**
   * Thiết lập X-Content-Type-Options
   */
  private setContentTypeOptions(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Content-Type-Options';
    meta.content = 'nosniff';
    document.head.appendChild(meta);
  }

  /**
   * Thiết lập Referrer-Policy
   */
  private setReferrerPolicy(): void {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(meta);
  }

  /**
   * Thiết lập Permissions Policy
   */
  private setPermissionsPolicy(): void {
    const permissions = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'payment=()',
      'usb=()',
    ].join(', ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Permissions-Policy';
    meta.content = permissions;
    document.head.appendChild(meta);
  }

  /**
   * Sanitize HTML input để chống XSS
   */
  sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting cho client-side requests
   */
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(
    key: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000
  ): boolean {
    if (!environment.rateLimit.enabled) {
      return true; // Skip rate limiting in development
    }

    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data (for logging purposes)
   */
  hashData(data: string): string {
    // Simple hash for logging - not for security purposes
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
