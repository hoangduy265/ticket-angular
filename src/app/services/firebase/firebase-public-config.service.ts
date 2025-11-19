import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FirebaseConfigService, FirebaseMessagingConfig } from './firebase-config.service';

@Injectable({
  providedIn: 'root',
})
export class FirebasePublicConfigService {
  constructor(private http: HttpClient, private firebaseConfigService: FirebaseConfigService) {}

  /**
   * Lấy Firebase config cho service worker
   * Trong development: trả về trực tiếp từ environment
   * Trong production: có thể fetch từ API (nếu implement)
   */
  getFirebaseMessagingConfig(): Observable<FirebaseMessagingConfig> {
    // Trong development, trả về trực tiếp
    if (!environment.production) {
      return of(this.firebaseConfigService.getFirebaseMessagingConfig());
    }

    // Trong production, có thể fetch từ API an toàn
    // return this.http.get<FirebaseMessagingConfig>('/api/firebase/public-config');

    // Hiện tại vẫn trả về từ environment (nhưng có thể implement API sau)
    return of(this.firebaseConfigService.getFirebaseMessagingConfig());
  }

  /**
   * Method để tạo API endpoint trong tương lai
   * Server-side nên implement endpoint này và validate request
   */
  createPublicConfigEndpoint(): string {
    return `
    // Example API endpoint (server-side):
    // GET /api/firebase/public-config
    app.get('/api/firebase/public-config', (req, res) => {
      // Validate request (có thể dùng API key, rate limiting, etc.)
      // Chỉ trả về config cần thiết cho messaging

      res.json({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
      });
    });
    `;
  }
}
