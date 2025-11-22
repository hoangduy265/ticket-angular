export const environment = {
  production: true,
  apiUrl: 'https://api.hoangduy.info/api',
  imgUrl: 'https://api.hoangduy.info',

  // Security settings
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXFrameOptions: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
  },

  // Firebase config - Sẽ được load từ API endpoint trong production
  firebase: {
    // Config này sẽ được fetch từ server để tăng bảo mật
    useApiEndpoint: true,
    apiEndpoint: '/api/firebase/config',
    // Fallback config (chỉ sử dụng khi API không khả dụng)
    fallback: {
      apiKey: 'AIzaSyA0a1nLp3I3pftqMZV5YU5bn_8h3Ai3ZQE',
      authDomain: 'royalnotify-2cb90.firebaseapp.com',
      projectId: 'royalnotify-2cb90',
      messagingSenderId: '774104407237',
      appId: '1:774104407237:web:211e6d555bca356c5824ac',
    },
  },
  // cofig telegram bot - email
  telegramBot: {
    chatId: '-4638641219',
  },

  EmailBot: {
    email: 'duyhq@royalgroup.vn',
  },

  // App Check settings
  appCheck: {
    enabled: true,
    provider: 'reCAPTCHA', // 'reCAPTCHA' | 'custom'
    siteKey: '', // Sẽ được set từ server-side hoặc build time
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // CORS settings (for development proxy)
  cors: {
    enabled: false,
  },
};
