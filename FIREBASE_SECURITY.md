# Firebase Security Best Practices

## 🔒 Bảo mật Firebase trong ứng dụng Angular

### 1. **Firebase Config Security**

#### ✅ Những gì AN TOÀN để public:
- `apiKey`: Firebase API key (được thiết kế để public)
- `authDomain`: Authentication domain
- `projectId`: Firebase project ID
- `messagingSenderId`: FCM sender ID
- `appId`: Firebase app ID

#### ❌ Những gì KHÔNG được expose:
- `serviceAccountKey.json`: Chứa private keys
- Database secrets
- Storage secrets
- Server-side API keys

### 2. **Vấn đề hiện tại**

Service worker (`firebase-messaging-sw.js`) hiện tại hardcode Firebase config:
```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyA0a1nLp3I3pftqMZV5YU5bn_8h3Ai3ZQE',
  // ... other config
};
```

**Rủi ro:**
- Attacker có thể biết project ID
- Có thể bị abuse để spam notifications
- Tăng surface attack

### 3. **Giải pháp đề xuất**

#### A. Sử dụng Environment Variables (Development)
```typescript
// environment.ts & environment.prod.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-api-key',
    // ... other config
  }
};
```

#### B. API Endpoint cho Production (Khuyến nghị)
```typescript
// Server-side API
app.get('/api/firebase/public-config', (req, res) => {
  // Validate request (rate limiting, API key, etc.)
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    // ... minimal config needed
  });
});
```

#### C. Firebase App Check (Bắt buộc cho Production)
```typescript
// Khởi tạo App Check để ngăn abuse
import { initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
});
```

### 4. **Implementation Steps**

#### Step 1: Setup Firebase App Check
1. Vào [Firebase Console](https://console.firebase.google.com)
2. Project Settings > App Check
3. Chọn "reCAPTCHA v3" cho Web apps
4. Đăng ký domain
5. Copy site key vào environment

#### Step 2: Environment Variables
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  firebase: {
    // ... config
    recaptchaSiteKey: 'YOUR_RECAPTCHA_SITE_KEY'
  }
};
```

#### Step 3: Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. **Monitoring & Alerts**

#### A. Firebase Console Monitoring
- Xem usage patterns
- Setup alerts cho suspicious activities
- Monitor App Check violations

#### B. Rate Limiting
```typescript
// Server-side rate limiting cho notification endpoints
const rateLimit = require('express-rate-limit');
app.use('/api/notifications', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 6. **Best Practices**

#### ✅ Do:
- Sử dụng Firebase App Check
- Validate tất cả inputs
- Implement proper authentication
- Use HTTPS only
- Monitor và log activities
- Regular security audits

#### ❌ Don't:
- Hardcode sensitive credentials
- Trust client-side validation only
- Expose server-side keys
- Skip security rules
- Ignore Firebase security warnings

### 7. **Testing Security**

```typescript
// Test App Check
describe('FirebaseSecurityService', () => {
  it('should initialize App Check in production', () => {
    // Test implementation
  });

  it('should skip App Check in development', () => {
    // Test implementation
  });
});
```

### 8. **Emergency Response**

Nếu phát hiện breach:
1. **Ngay lập tức**: Disable compromised API keys
2. **Kiểm tra**: Audit logs để tìm suspicious activities
3. **Cập nhật**: Security rules
4. **Thông báo**: Users affected
5. **Prevent**: Implement additional security measures

---

## 📞 Liên hệ

Nếu có câu hỏi về bảo mật Firebase, hãy tham khảo:
- [Firebase Security Documentation](https://firebase.google.com/docs/security)
- [Firebase App Check Guide](https://firebase.google.com/docs/app-check)
- [OWASP Web Security Guidelines](https://owasp.org/www-project-top-ten/)