import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { APP_INITIALIZER } from '@angular/core';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { FirebaseSecurityService } from './services/firebase/firebase-security.service';
import { SecurityService } from './services/security.service';
import { GlobalErrorHandler } from './services/global-error-handler.service';

// Kiểm tra hỗ trợ Firebase Messaging
const isFirebaseMessagingSupported = () => {
  return typeof window !== 'undefined' &&
         'serviceWorker' in navigator &&
         'PushManager' in window &&
         'Notification' in window;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Firebase providers sử dụng config từ environment
    provideFirebaseApp(() => initializeApp(environment.firebase.fallback)),
    // Chỉ khởi tạo Firebase Messaging nếu browser hỗ trợ
    ...(isFirebaseMessagingSupported() ? [provideMessaging(() => getMessaging())] : []),
    // Security services
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    // Khởi tạo Firebase Security (App Check)
    {
      provide: APP_INITIALIZER,
      useFactory: (securityService: FirebaseSecurityService) => () => {
        securityService.initializeAppCheck();
      },
      deps: [FirebaseSecurityService],
      multi: true,
    },
    // Khởi tạo Security Service
    {
      provide: APP_INITIALIZER,
      useFactory: (securityService: SecurityService) => () => {
        // Security service tự động khởi tạo trong constructor
        return Promise.resolve();
      },
      deps: [SecurityService],
      multi: true,
    },
  ],
};
