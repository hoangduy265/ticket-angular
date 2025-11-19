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

      const notificationTitle = payload.notification?.title || 'Thông báo';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/assets/icons/icon-192x192.png',
        badge: payload.notification?.icon || '/assets/icons/icon-192x192.png',
        tag: payload.notification?.tag || 'notification',
        data: payload.data || {},
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
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
  console.log('Notification click received.');

  event.notification.close();

  // Điều hướng đến trang cụ thể khi click vào notification
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
