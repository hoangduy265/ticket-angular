import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ToastComponent } from './components/toast/toast.component/toast.component';
import { FirebaseFCMService } from './services/firebase/firebase-fcm.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChangePasswordComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('ticket');

  private fcmService = inject(FirebaseFCMService);

  ngOnInit(): void {
    // Khởi tạo Firebase FCM khi ứng dụng bắt đầu
    this.initializeFCM();
  }

  private async initializeFCM(): Promise<void> {
    try {
      // Khởi tạo Firebase FCM với config từ service
      await this.fcmService.initialize();
    } catch (error) {
      console.error('Lỗi khởi tạo FCM:', error);
    }
  }
}
