# Ticket

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Firebase FCM Configuration

This application uses Firebase Cloud Messaging (FCM) for push notifications. Follow these steps to configure FCM:

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Firebase Cloud Messaging

**Note**: File `serviceAccountKey.json` chỉ được sử dụng để lấy `project_id`. Các thông tin khác (API key, sender ID, app ID) phải được lấy từ Firebase Console để đảm bảo bảo mật.

### 2. Configure Firebase in the Application

Cập nhật Firebase config trong `src/app/services/firebase-config.service.ts`:

```typescript
// Thay thế các giá trị placeholder bằng thông tin thực tế từ Firebase Console
this.config = {
  apiKey: 'your-actual-api-key', // Project Settings > General > Web API Key
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: 'your-sender-id', // Project Settings > Cloud Messaging > Sender ID
  appId: 'your-app-id' // Project Settings > General > App ID
};
```

### 3. Generate VAPID Key

1. Trong Firebase Console, vào **Project Settings > Cloud Messaging**
2. Trong phần **Web Push certificates**, click **Generate key pair**
3. Sao chép VAPID key và cập nhật trong `FirebaseConfigService.getVapidKey()`:

```typescript
getVapidKey(): string {
  return 'YOUR_ACTUAL_VAPID_KEY_HERE'; // Thay thế bằng VAPID key thực tế
}
```

### 4. Configure Server-Side Token Registration

Implement the API endpoints in your backend to:

- Store device tokens when users log in
- Remove device tokens when users log out
- Send push notifications to registered devices

### 5. Service Worker (Optional)

For background notifications when the app is closed, create a service worker file and register it in your main.ts.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
