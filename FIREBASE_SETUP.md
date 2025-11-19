# Hướng dẫn cấu hình Firebase FCM

## Thông tin từ serviceAccountKey.json

Từ file `serviceAccountKey.json`, chúng ta có:

- **Project ID**: `royalnotify-2cb90`

## Các bước cấu hình

### 1. Lấy thông tin từ Firebase Console

Truy cập [Firebase Console](https://console.firebase.google.com/) và chọn project `royalnotify-2cb90`:

#### 1.1 Lấy Web API Key

- Vào **Project Settings** > **General** > **Your apps**
- Tìm Web app và copy **Web API Key** (có dạng `AIzaSyD...`)

#### 1.2 Lấy Sender ID

- Vào **Project Settings** > **Cloud Messaging**
- Copy **Sender ID** (số có 9-10 chữ số)

#### 1.3 Lấy App ID

- Vào **Project Settings** > **General** > **Your apps**
- Tìm Web app và copy **App ID** (có dạng `1:xxx:web:xxx`)

#### 1.4 Tạo VAPID Key

- Vào **Project Settings** > **Cloud Messaging**
- Trong phần **Web Push certificates**, click **Generate key pair**
- Copy **VAPID Key** được tạo

### 2. Cập nhật Firebase config trong environment files

Các file environment đã được cập nhật với project ID từ `serviceAccountKey.json`:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Cập nhật các thông tin còn lại từ Firebase Console:

```typescript
firebase: {
  apiKey: 'your-actual-api-key', // ← Thay thế bằng Web API Key thực tế
  authDomain: 'royalnotify-2cb90.firebaseapp.com', // ← Đã cập nhật
  projectId: 'royalnotify-2cb90', // ← Đã cập nhật từ serviceAccountKey.json
  storageBucket: 'royalnotify-2cb90.appspot.com', // ← Đã cập nhật
  messagingSenderId: 'your-sender-id', // ← Thay thế bằng Sender ID thực tế
  appId: 'your-app-id' // ← Thay thế bằng App ID thực tế
}
```

### 3. Cập nhật VAPID Key

Cập nhật VAPID key trong `FirebaseFCMService.getVapidKey()`:

### 3. Test FCM

Sau khi cập nhật config, chạy ứng dụng và kiểm tra:

1. Ứng dụng yêu cầu quyền thông báo
2. Token được tạo và log ra console
3. Có thể nhận thông báo push từ Firebase Console

## Lưu ý bảo mật

- **KHÔNG** commit file `serviceAccountKey.json` lên Git
- **KHÔNG** expose private key ra client-side
- Chỉ sử dụng thông tin public từ Firebase Console cho client-side config