export const environment = {
  production: false,
  apiUrl: 'http://localhost:5291/api',
  imgUrl: 'http://localhost:5291',
  // apiUrl: 'https://api.hoangduy.info/api',
  // imgUrl: 'https://api.hoangduy.info',

  // Security settings
  security: {
    enableCSP: false, // Disabled in development for easier debugging
    enableHSTS: false,
    enableXFrameOptions: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: false,
  },

  // Firebase config
  firebase: {
    useApiEndpoint: false, // Use direct config in development
    apiEndpoint: '/api/firebase/config',
    fallback: {
      apiKey: 'AIzaSyA0a1nLp3I3pftqMZV5YU5bn_8h3Ai3ZQE',
      authDomain: 'royalnotify-2cb90.firebaseapp.com',
      databaseURL: 'https://royalnotify-2cb90-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: 'royalnotify-2cb90',
      storageBucket: 'royalnotify-2cb90.firebasestorage.app',
      messagingSenderId: '774104407237',
      appId: '1:774104407237:web:211e6d555bca356c5824ac',
      measurementId: 'G-G9GR0NMJG8',
    },
  },

  // cofig telegram bot - email
  telegramBot: {
    chatId: '-4638641219',
  },

  EmailBot: {
    email: 'duyhq@royalgroup.vn',
  },

  FCMFirebase_Department: {
    DepartmentId: '2',
  },

  // App Check settings
  appCheck: {
    enabled: false, // Disabled in development
    provider: 'reCAPTCHA',
    siteKey: '',
  },

  // Rate limiting
  rateLimit: {
    enabled: false, // Disabled in development
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000,
  },

  // CORS settings
  cors: {
    enabled: true, // Enabled for development proxy
  },
};
