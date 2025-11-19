import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SecurityService } from './security.service';

@Injectable({
  providedIn: 'root',
})
export class InputValidationService {
  constructor(private securityService: SecurityService) {}

  /**
   * Custom validators cho Angular Reactive Forms
   */

  /**
   * Validator cho email với enhanced security
   */
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const isValid = this.securityService.validateEmail(control.value);

      // Additional security checks
      if (isValid) {
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /\.{2,}/, // Multiple consecutive dots
          /[<>'"\\]/, // HTML/script injection characters
          /\s/, // Spaces in email
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(control.value)) {
            return { email: { message: 'Invalid email format' } };
          }
        }
      }

      return isValid ? null : { email: { message: 'Invalid email address' } };
    };
  }

  /**
   * Validator cho password strength
   */
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = control.value;
      const errors: any = {};

      // Length check
      if (password.length < 8) {
        errors.minLength = 'Password must be at least 8 characters long';
      }

      // Complexity checks
      if (!/[A-Z]/.test(password)) {
        errors.uppercase = 'Password must contain at least one uppercase letter';
      }

      if (!/[a-z]/.test(password)) {
        errors.lowercase = 'Password must contain at least one lowercase letter';
      }

      if (!/\d/.test(password)) {
        errors.number = 'Password must contain at least one number';
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.special = 'Password must contain at least one special character';
      }

      // Check for common weak passwords
      const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
      if (commonPasswords.includes(password.toLowerCase())) {
        errors.common = 'This password is too common';
      }

      return Object.keys(errors).length > 0 ? { password: errors } : null;
    };
  }

  /**
   * Validator cho URL
   */
  urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const isValid = this.securityService.validateUrl(control.value);

      if (!isValid) {
        return { url: { message: 'Invalid URL format' } };
      }

      // Additional security checks
      const url = control.value.toLowerCase();
      if (url.includes('javascript:') || url.includes('data:') || url.includes('vbscript:')) {
        return { url: { message: 'Invalid URL protocol' } };
      }

      return null;
    };
  }

  /**
   * Validator cho SQL injection prevention
   */
  sqlInjectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const sqlPatterns = [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
        /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(\%27)|(\%23))/i,
        /(<script|javascript:|vbscript:|onload=|onerror=)/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(control.value)) {
          return { injection: { message: 'Invalid input detected' } };
        }
      }

      return null;
    };
  }

  /**
   * Sanitize input functions
   */

  /**
   * Sanitize text input
   */
  sanitizeText(input: string): string {
    if (!input) return '';

    // Remove HTML tags
    const withoutHtml = input.replace(/<[^>]*>/g, '');

    // Remove script tags and their content
    const withoutScripts = withoutHtml.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );

    // Remove javascript: URLs
    const withoutJsUrls = withoutScripts.replace(/javascript:[^"']*/gi, '');

    // Trim whitespace
    return withoutJsUrls.trim();
  }

  /**
   * Sanitize HTML input (allow safe tags)
   */
  sanitizeHtml(input: string, allowedTags: string[] = []): string {
    if (!input) return '';

    // If no tags allowed, use text sanitization
    if (allowedTags.length === 0) {
      return this.sanitizeText(input);
    }

    // Remove dangerous tags and attributes
    let sanitized = input;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:[^"']*/gi, '');

    // Remove dangerous attributes
    const dangerousAttrs = [
      'onclick',
      'onload',
      'onerror',
      'onmouseover',
      'onmouseout',
      'onkeydown',
      'onkeyup',
    ];
    for (const attr of dangerousAttrs) {
      const regex = new RegExp(`${attr}="[^"]*"`, 'gi');
      sanitized = sanitized.replace(regex, '');
      const regex2 = new RegExp(`${attr}='[^']*'`, 'gi');
      sanitized = sanitized.replace(regex2, '');
    }

    return sanitized;
  }

  /**
   * Validate file upload
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file extension
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
        };
      }
    }

    // Check for dangerous file names
    const dangerousPatterns = [
      /\.\./, // Directory traversal
      /^[.-]/, // Hidden files starting with . or -
      /[<>:"\/\\|?*\x00-\x1f]/, // Invalid characters
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.name)) {
        return { valid: false, error: 'Invalid file name' };
      }
    }

    return { valid: true };
  }

  /**
   * Rate limiting cho form submissions
   */
  checkFormSubmissionRate(formId: string): boolean {
    return this.securityService.checkRateLimit(`form_${formId}`, 5, 60 * 1000); // 5 submissions per minute
  }

  /**
   * Validate input length
   */
  validateLength(input: string, min: number = 0, max: number = Infinity): boolean {
    const length = input.trim().length;
    return length >= min && length <= max;
  }

  /**
   * Check for suspicious patterns
   */
  hasSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.cookie/i,
      /localStorage\./i,
      /sessionStorage\./i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(input));
  }
}
