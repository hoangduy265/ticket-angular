// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js');

let firebaseMessagingInstance = null;
let firebaseInitialized = false;

const initializeFirebase = (config) => {
  if (!config || firebaseInitialized) {
    return;
  }

  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(config);
    }

    firebaseMessagingInstance = firebase.messaging();
    firebaseInitialized = true;
    console.log('[Firebase SW] Firebase initialized from dynamic config');

    firebaseMessagingInstance.onBackgroundMessage((payload) => {
      console.log('[Firebase SW] Received background message', payload);

      const notificationTitle =
        payload.notification?.title || payload.data?.title || 'Thông báo mới';
      const notificationBody =
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message ||
        'Bạn có thông báo mới';
      const notificationIcon = payload.notification?.icon || '/assets/logo.png';

      alert('FCM Background Message Received:\n' + notificationTitle + '\n' + notificationBody);

      const notificationOptions = {
        body: notificationBody,
        icon: notificationIcon,
        badge: notificationIcon,
        tag: payload.notification?.tag || payload.data?.tag || 'firebase-notification',
        data: {
          url: payload.data?.url || '/',
          ...payload.data,
        },
        requireInteraction: true, // Yêu cầu user tương tác để đóng
        silent: false, // Có âm thanh
        actions: [
          {
            action: 'view',
            title: 'Xem',
            icon: '/assets/logo.png',
          },
          {
            action: 'close',
            title: 'Đóng',
          },
        ],
      };

      self.registration.showNotification(notificationTitle, notificationOptions);

      // Gửi message về client để track
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_MESSAGE_RECEIVED',
            payload: payload,
          });
        });
      });
    });
  } catch (error) {
    firebaseInitialized = false;
    console.error('[Firebase SW] Failed to initialize Firebase:', error);
  }
};

const loadFirebaseConfig = async () => {
  try {
    const response = await fetch('/assets/firebase-config.json', { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const config = await response.json();
    initializeFirebase(config);
  } catch (error) {
    console.warn('[Firebase SW] Unable to fetch Firebase config:', error);
  }
};

// Thử load config ngay khi service worker khởi tạo
loadFirebaseConfig();

// Lắng nghe config gửi từ client (fallback)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'FIREBASE_CONFIG' && data.payload) {
    initializeFirebase(data.payload);
  }
});

// Xử lý click vào notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'view') {
    // Mở trang cụ thể
    const urlToOpen = notificationData.url || '/';
    event.waitUntil(clients.openWindow(urlToOpen));
  } else if (action === 'close') {
    // Chỉ đóng notification
    return;
  } else {
    // Click vào notification body (mặc định action)
    const urlToOpen = notificationData.url || '/';
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});

// Xử lý notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
