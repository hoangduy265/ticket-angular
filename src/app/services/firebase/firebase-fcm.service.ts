import { Injectable, inject, Injector } from '@angular/core';
import { Messaging, getToken, onMessage, isSupported } from '@angular/fire/messaging';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '../../components/toast/toast.service';
import { FirebaseConfigService } from './firebase-config.service';
import { SecurityService } from '../security.service';
import { DeviceTokenService } from '../device-token.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseFCMService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private messageSubject = new BehaviorSubject<any>(null);

  public token$ = this.tokenSubject.asObservable();
  public message$ = this.messageSubject.asObservable();

  private messaging: Messaging | null = null;
  private injector = inject(Injector);

  constructor(
    private toastService: ToastService,
    private firebaseConfigService: FirebaseConfigService,
    private securityService: SecurityService,
    private deviceTokenService: DeviceTokenService
  ) {
    // Lazy inject Messaging chỉ khi được hỗ trợ
    this.initializeMessaging();
    // Setup service worker update handling
    this.setupServiceWorkerUpdateHandling();
  }

  private async initializeMessaging(): Promise<void> {
    try {
      const supported = await this.isSupported();
      if (supported) {
        this.messaging = this.injector.get(Messaging);
      }
    } catch (error) {
      console.warn('Firebase Messaging không khả dụng:', error);
    }
  }

  /**
   * Setup service worker update handling để đảm bảo background notifications hoạt động
   */
  private setupServiceWorkerUpdateHandling(): void {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload page để đảm bảo service worker mới hoạt động
      window.location.reload();
    });
  }

  /**
   * Lấy VAPID key từ Firebase Config Service
   */
  private async getVapidKey(): Promise<string> {
    return await this.firebaseConfigService.getVapidKey();
  }

  /**
   * Kiểm tra xem trình duyệt có hỗ trợ FCM không
   */
  async isSupported(): Promise<boolean> {
    return await isSupported();
  }

  /**
   * Yêu cầu quyền thông báo từ người dùng
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Trình duyệt không hỗ trợ thông báo');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Đăng ký service worker Firebase
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    // console.log('>>> registerServiceWorker() called');

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker không được hỗ trợ');
      return null;
    }

    // console.log('>>> Service Worker is supported');

    try {
      // Kiểm tra xem đã có service worker Firebase chưa
      // console.log('>>> Getting existing registrations...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      // console.log('>>> Found registrations:', registrations.length);

      // registrations.forEach((reg, index) => {
      //   console.log(`>>> Registration ${index}:`, {
      //     scope: reg.scope,
      //     activeURL: reg.active?.scriptURL,
      //     state: reg.active?.state,
      //   });
      // });

      const existingRegistration = registrations.find(
        (reg) =>
          reg.scope.includes('firebase-cloud-messaging-push-scope') ||
          reg.active?.scriptURL.includes('firebase-messaging-sw.js')
      );

      if (existingRegistration) {
        // console.log('>>> ✅ Service Worker đã tồn tại, sử dụng lại:', existingRegistration.scope);

        // Gửi config cho service worker đã tồn tại
        // console.log('>>> Sending config to existing worker...');
        await this.sendConfigToServiceWorker(existingRegistration);

        // Kiểm tra service worker state
        // console.log('>>> Service worker state:', {
        //   active: existingRegistration.active?.state,
        //   waiting: existingRegistration.waiting?.state,
        //   installing: existingRegistration.installing?.state,
        // });

        // Nếu service worker đã active, không cần đợi ready nữa
        if (existingRegistration.active?.state === 'activated') {
          return existingRegistration;
        }

        // Chỉ đợi ready nếu chưa active
        try {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Service worker ready timeout')), 5000)
            ),
          ]);
        } catch (error) {
          console.warn('>>> Service worker ready timeout, continuing anyway...', error);
        }

        return existingRegistration;
      }

      // Nếu chưa có, đăng ký mới
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });

      // Đợi service worker ready
      const readyRegistration = await navigator.serviceWorker.ready;
      await this.sendConfigToServiceWorker(readyRegistration);
      await this.sendConfigToServiceWorker(registration);

      return registration;
    } catch (error) {
      console.error('>>> ❌ Lỗi khi đăng ký Service Worker:', error);
      return null;
    }
  }

  /**
   * Gửi Firebase config tới service worker để khởi tạo firebase.initializeApp
   */
  private async sendConfigToServiceWorker(registration: ServiceWorkerRegistration): Promise<void> {
    const message = {
      type: 'FIREBASE_CONFIG',
      payload: this.firebaseConfigService.getFirebaseMessagingConfig(),
    };

    const postMessage = (worker: ServiceWorker | null) => {
      if (worker) {
        worker.postMessage(message);
      }
    };

    if (registration.active) {
      postMessage(registration.active);
      return;
    }

    const targetWorker = registration.waiting || registration.installing;
    if (targetWorker) {
      if (targetWorker.state === 'activated') {
        postMessage(targetWorker);
        return;
      }

      const handleStateChange = () => {
        if (targetWorker.state === 'activated') {
          postMessage(targetWorker);
          targetWorker.removeEventListener('statechange', handleStateChange);
        }
      };

      targetWorker.addEventListener('statechange', handleStateChange);
      return;
    }

    if (navigator.serviceWorker.controller) {
      postMessage(navigator.serviceWorker.controller);
      return;
    }

    const handleControllerChange = () => {
      if (navigator.serviceWorker.controller) {
        postMessage(navigator.serviceWorker.controller);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
  }

  /**
   * Hủy đăng ký service worker cũ (chỉ dùng khi cần force reload)
   */
  async forceUnregisterServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          // Chỉ unregister service worker Firebase messaging
          if (
            registration.scope.includes('firebase-cloud-messaging-push-scope') ||
            registration.scope.includes('firebase-messaging-sw.js')
          ) {
            await registration.unregister();
            console.log('Đã hủy đăng ký service worker cũ:', registration.scope);
          }
        }
      } catch (error) {
        console.warn('Lỗi khi hủy đăng ký service worker cũ:', error);
      }
    }
  }

  /**
   * Lấy device token từ Firebase
   */
  async getDeviceToken(vapidKey?: string): Promise<string | null> {
    try {
      // Kiểm tra hỗ trợ Firebase Messaging
      const supported = await isSupported();
      // console.log('Firebase Messaging supported:', supported);

      const userAgent = navigator.userAgent;
      const isEdge = /Edg\//.test(userAgent);
      const isChrome = /Chrome\//.test(userAgent) && !isEdge;
      const isSafari = /Safari\//.test(userAgent) && !isChrome && !isEdge;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);

      if (!supported || !this.messaging) {
        console.warn(
          'Firebase Messaging không được hỗ trợ trên trình duyệt này hoặc chưa được khởi tạo'
        );
        return null;
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Người dùng từ chối quyền thông báo');
        return null;
      }

      // Đăng ký hoặc sử dụng lại service worker
      // console.log('>>> Calling registerServiceWorker()...');
      const registration = await this.registerServiceWorker();
      // console.log('>>> registerServiceWorker() returned:', registration);

      if (!registration) {
        console.error('>>> ❌ Không thể đăng ký service worker - registration is null');
        return null;
      }

      // console.log('>>> ✅ Registration successful:', {
      //   scope: registration.scope,
      //   active: registration.active?.state,
      // });

      // Đợi một chút để service worker ổn định
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Lấy và validate VAPID key
      const vapidKeyValue = await this.getVapidKey();

      // console.log('=== FCM Token Generation ===');
      // console.log('1. VAPID Key:', vapidKeyValue);
      // console.log('2. Service Worker Registration:', {
      //   scope: registration.scope,
      //   active: registration.active?.state,
      //   waiting: registration.waiting?.state,
      //   installing: registration.installing?.state,
      // });

      if (!vapidKeyValue || vapidKeyValue.trim() === '') {
        console.error('VAPID key không hợp lệ hoặc chưa được cấu hình');
        return null;
      }

      // console.log('3. Calling getToken()...');

      try {
        const token = await getToken(this.messaging, {
          vapidKey: vapidKeyValue,
          serviceWorkerRegistration: registration,
        });

        // console.log('4. getToken() result:', token ? 'SUCCESS' : 'EMPTY');

        if (token) {
          // console.log('5. ✅ Device token received:', token);
          // console.log('   Token length:', token.length);
          this.tokenSubject.next(token);
          localStorage.setItem('fcm_device_token', token);
          localStorage.setItem('fcm_token_platform', isIOS ? 'ios' : isAndroid ? 'android' : 'web');
          return token;
        } else {
          console.warn('5. ❌ Không thể lấy device token - getToken returned empty');
          return null;
        }
      } catch (tokenError) {
        console.error('4. ❌ Error calling getToken():', tokenError);
        console.error('   Error details:', {
          message: (tokenError as Error).message,
          stack: (tokenError as Error).stack,
        });
        throw tokenError;
      }
    } catch (error) {
      console.error('Lỗi khi lấy device token:', error);
      return null;
    }
  }

  /**
   * Lắng nghe messages từ Service Worker (background notifications)
   */
  setupServiceWorkerMessageListener(): void {
    if (!('serviceWorker' in navigator)) {
      console.warn('[FirebaseFCM] Service Worker not supported');
      return;
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data || {};

      if (data.type === 'BACKGROUND_MESSAGE_RECEIVED') {
        debugger;
        // console.log('[FirebaseFCM] Background message received from SW:', data.payload);

        const payload = data.payload;
        let toastTitle = 'Thông báo';
        let toastMessage = '';

        if (payload.notification) {
          toastTitle = payload.notification.title || 'Thông báo';
          toastMessage = payload.notification.body || '';
        } else if (payload.data) {
          toastTitle = payload.data['title'] || payload.data['subject'] || 'Thông báo mới';
          toastMessage =
            payload.data['body'] ||
            payload.data['message'] ||
            payload.data['content'] ||
            'Bạn có thông báo mới';
        }

        // Hiển thị toast KHÔNG tự động đóng (duration = 0)
        if (toastMessage || toastTitle !== 'Thông báo') {
          this.toastService.showInfo(`${toastTitle}: ${toastMessage}`, 0);
        }
      }
    });

    // console.log('[FirebaseFCM] Service Worker message listener setup complete');
  }

  /**
   * Lắng nghe thông báo khi ứng dụng đang mở (Foreground)
   */
  async listenForMessages(): Promise<void> {
    try {
      const supported = await isSupported();
      if (!supported || !this.messaging) {
        console.warn(
          'Firebase Messaging không được hỗ trợ hoặc chưa được khởi tạo - không thể lắng nghe messages'
        );
        return;
      }

      onMessage(this.messaging, (payload) => {
        // console.log('[FirebaseFCM] Foreground message received:', payload);

        // Phát ra thông báo qua observable
        this.messageSubject.next(payload);

        // Hiển thị thông báo toast
        let toastMessage = '';
        let toastTitle = 'Thông báo';

        if (payload.notification) {
          // Trường hợp có notification object (thông báo hiển thị)
          toastTitle = payload.notification.title || 'Thông báo';
          toastMessage = payload.notification.body || '';
        } else if (payload.data) {
          // Trường hợp chỉ có data (thông báo data-only từ server)
          toastTitle = payload.data['title'] || payload.data['subject'] || 'Thông báo mới';
          toastMessage =
            payload.data['body'] ||
            payload.data['message'] ||
            payload.data['content'] ||
            'Bạn có thông báo mới';
        }

        // Hiển thị toast KHÔNG tự động đóng (duration = 0)
        if (toastMessage || toastTitle !== 'Thông báo') {
          this.toastService.showInfo(`${toastTitle}: ${toastMessage}`);
          this.playNotificationSound();
        }

        // Luôn hiển thị notification của trình duyệt (popup ở góc dưới bên trái)
        this.showBrowserNotification(payload);
      });
    } catch (error) {
      console.error('Lỗi khi lắng nghe messages:', error);
    }
  }

  // Phát âm thanh thông báo
  private playNotificationSound() {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.warn('Cannot play notification sound:', err);
      });
    } catch (error) {
      console.warn('Notification sound error:', error);
    }
  }

  /**
   * Gửi device token lên server
   */
  async registerDeviceToken(token: string, userId?: string): Promise<void> {
    try {
      if (!userId) {
        console.warn('Không có userId để đăng ký device token');
        return;
      }

      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        console.error('userId không hợp lệ:', userId);
        return;
      }

      // Gọi API để đăng ký hoặc cập nhật device token
      this.deviceTokenService.registerOrUpdateToken(userIdNumber, token, 'web').subscribe({
        next: (deviceToken) => {
          // console.log('Device token đã được đăng ký thành công:', deviceToken);
        },
        error: (error) => {
          console.error('Lỗi khi đăng ký device token:', error);
        },
      });
    } catch (error) {
      console.error('Lỗi khi đăng ký device token:', error);
      throw error;
    }
  }

  /**
   * Hủy đăng ký device token
   */
  async unregisterDeviceToken(userId: string): Promise<void> {
    try {
      if (!userId) {
        console.warn('Không có userId để hủy đăng ký device token');
        return;
      }

      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        console.error('userId không hợp lệ:', userId);
        return;
      }

      // Vô hiệu hóa tất cả device tokens của user
      this.deviceTokenService.deactivateAllUserTokens(userIdNumber).subscribe({
        next: () => {
          console.log('Tất cả device tokens đã được vô hiệu hóa');
          this.tokenSubject.next(null);
        },
        error: (error) => {
          console.error('Lỗi khi hủy đăng ký device token:', error);
        },
      });
    } catch (error) {
      console.error('Lỗi khi hủy đăng ký device token:', error);
      throw error;
    }
  }

  /**
   * Khởi tạo FCM service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      // Setup listener cho background messages từ Service Worker
      this.setupServiceWorkerMessageListener();

      const token = await this.getDeviceToken();
      if (token) {
        await this.registerDeviceToken(token, userId);
        this.listenForMessages();
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo FCM:', error);
    }
  }

  /**
   * Hiển thị notification của trình duyệt (popup ở góc dưới bên trái)
   */
  private showBrowserNotification(payload: any): void {
    if (!('Notification' in window)) {
      console.warn('Trình duyệt không hỗ trợ Notification API');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Không có quyền hiển thị notification');
      return;
    }

    // Tạo nội dung notification từ payload
    let title = 'Thông báo';
    let body = '';
    let icon = '/assets/logo.png'; // Default icon
    let data = {};

    if (payload.notification) {
      title = payload.notification.title || 'Thông báo';
      body = payload.notification.body || '';
      icon = payload.notification.icon || icon;
    } else if (payload.data) {
      title = payload.data['title'] || payload.data['subject'] || 'Thông báo mới';
      body =
        payload.data['body'] ||
        payload.data['message'] ||
        payload.data['content'] ||
        'Bạn có thông báo mới';
      data = payload.data;
    }

    // Tạo notification với các tùy chọn để xuất hiện trong Windows Action Center
    const notificationOptions: NotificationOptions = {
      body: body,
      icon: icon,
      badge: icon,
      tag: payload.notification?.tag || payload.data?.['tag'] || 'firebase-notification',
      data: {
        url: payload.data?.['url'] || '/',
        ...data,
      },
      requireInteraction: true, // Yêu cầu user tương tác để đóng
      silent: false, // Có âm thanh
    };

    // Hiển thị notification
    const notification = new Notification(title, notificationOptions);

    // Xử lý sự kiện click vào notification
    notification.onclick = () => {
      notification.close();
      // Focus vào cửa sổ ứng dụng
      window.focus();
      // Có thể thêm logic để điều hướng đến trang cụ thể dựa trên data
      console.log('Notification clicked with data:', data);
    };

    // Không tự động đóng để notification tồn tại trong Action Center
    // setTimeout(() => {
    //   notification.close();
    // }, 5000);
  }

  /**
   * Lấy token hiện tại
   */
  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }
}
