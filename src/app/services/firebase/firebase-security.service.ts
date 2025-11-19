import { Injectable } from '@angular/core';
import { initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { environment } from '../../../environments/environment';
import { FirebaseConfigService } from './firebase-config.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseSecurityService {
  constructor(private firebaseConfigService: FirebaseConfigService) {}

  /**
   * Khởi tạo Firebase App Check để bảo vệ khỏi abuse
   * App Check giúp ngăn chặn spam notifications và bảo vệ Firebase services
   */
  initializeAppCheck(): void {
    // Chỉ khởi tạo trong production và khi được bật
    if (!environment.production || !environment.appCheck.enabled) {
      console.log('Firebase App Check disabled or not in production');
      return;
    }

    try {
      // Cần setup reCAPTCHA v3 site key trong Firebase Console
      // Project Settings > App Check > reCAPTCHA v3

      const appCheck = initializeAppCheck(undefined, {
        provider: new ReCaptchaV3Provider(environment.appCheck.siteKey || ''),
        isTokenAutoRefreshEnabled: true,
      });

      console.log('Firebase App Check initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase App Check:', error);
    }
  }

  /**
   * Hướng dẫn setup Firebase App Check:
   *
   * 1. Vào Firebase Console > Project Settings > App Check
   * 2. Chọn "reCAPTCHA v3" cho Web apps
   * 3. Đăng ký domain của bạn
   * 4. Copy site key và paste vào environment
   * 5. Enable App Check cho Cloud Messaging
   *
   * 6. Trong environment.prod.ts:
   * export const environment = {
   *   production: true,
   *   firebase: {
   *     // ... other config
   *     recaptchaSiteKey: 'YOUR_RECAPTCHA_SITE_KEY'
   *   }
   * };
   */

  /**
   * Kiểm tra Firebase Security Rules
   * Đảm bảo chỉ có authenticated users mới có thể gửi notifications
   */
  validateSecurityRules(): string {
    return `
    // Firestore Security Rules example:
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Chỉ authenticated users có thể read/write
        match /{document=**} {
          allow read, write: if request.auth != null;
        }

        // Specific rules cho notifications
        match /notifications/{notificationId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null &&
                      request.auth.uid == resource.data.userId;
        }
      }
    }

    // Storage Security Rules example:
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=*} {
          allow read, write: if request.auth != null;
        }
      }
    }
    `;
  }
}
