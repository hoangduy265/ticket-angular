import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseMessagingConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseConfigService {
  private config: FirebaseConfig | null = null;

  constructor() {}

  /**
   * Lấy Firebase config từ environment
   */
  getFirebaseConfig(): FirebaseConfig {
    if (this.config) {
      return this.config;
    }

    // Sử dụng config từ environment
    this.config = environment.firebase.fallback as FirebaseConfig;
    return this.config;
  }

  /**
   * Lấy Firebase config chỉ cho messaging (ít thông tin hơn)
   * Sử dụng cho service worker để giảm surface attack
   */
  getFirebaseMessagingConfig(): FirebaseMessagingConfig {
    const fullConfig = this.getFirebaseConfig();
    return {
      apiKey: fullConfig.apiKey,
      authDomain: fullConfig.authDomain,
      projectId: fullConfig.projectId,
      messagingSenderId: fullConfig.messagingSenderId,
      appId: fullConfig.appId,
    };
  }

  /**
   * Kiểm tra xem có đang chạy trong production không
   */
  isProduction(): boolean {
    return environment.production;
  }

  /**
   * Lấy VAPID key từ server-side API (bảo mật hơn)
   */
  async getVapidKey(): Promise<string> {
    // Ưu tiên load từ server-side API
    if (environment.firebase.useApiEndpoint) {
      try {
        const response = await fetch(`${environment.apiUrl}/firebase/vapid-key`);
        if (response.ok) {
          const data = await response.json();
          return data.vapidKey;
        }
        console.warn('Không thể load VAPID key từ API, sử dụng fallback');
      } catch (error) {
        console.warn('Lỗi khi load VAPID key từ API:', error);
      }
    }

    // Fallback: VAPID key từ Firebase Console (chỉ dùng trong development)
    // ⚠️ SECURITY: Không nên commit VAPID key vào source code
    const fallbackVapidKey = 'BPg7VENzsCSYBhqhd3PxXSksFjnLiYPPbv_hgP7G8maUlcwYnNmRsJaCrC-iD2-5T2fwNIIXOJaawoBWHwkegqI';

    if (!fallbackVapidKey || fallbackVapidKey.trim() === '') {
      console.error('VAPID key chưa được cấu hình');
      throw new Error('VAPID key is not configured');
    }

    return fallbackVapidKey;
  }
}
