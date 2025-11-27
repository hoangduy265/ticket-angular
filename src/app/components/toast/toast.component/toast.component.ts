import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from '../toast.service';

interface Toast extends ToastMessage {
  id: string;
}

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toast$.subscribe((toastMessage) => {
      if (toastMessage) {
        this.addToast(toastMessage);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addToast(toastMessage: ToastMessage) {
    const toast: Toast = {
      ...toastMessage,
      id: this.generateId(),
    };

    // Thêm toast mới vào ĐẦU mảng (unshift) thay vì cuối (push)
    // Toast mới sẽ hiển thị ở trên, toast cũ đẩy xuống dưới
    this.toasts.unshift(toast);

    // Auto remove after duration (chỉ khi duration > 0)
    const duration = toast.duration || 0;
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  getToastClasses(toast: Toast): string {
    const baseClasses = 'toast align-items-center border-0';
    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-success text-white`;
      case 'error':
        return `${baseClasses} bg-danger text-white`;
      case 'warning':
        return `${baseClasses} bg-warning text-dark`;
      case 'info':
        return `${baseClasses} bg-info text-white`;
      default:
        return `${baseClasses} bg-secondary text-white`;
    }
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-bell';
    }
  }

  getToastTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'Thành công';
      case 'error':
        return 'Lỗi';
      case 'warning':
        return 'Cảnh báo';
      case 'info':
        return 'Thông tin';
      default:
        return 'Thông báo';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
