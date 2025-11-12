import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  public toast$ = this.toastSubject.asObservable();

  showSuccess(message: string, duration = 3000): void {
    this.toastSubject.next({ type: 'success', message, duration });
  }

  showError(message: string, duration = 5000): void {
    this.toastSubject.next({ type: 'error', message, duration });
  }

  showWarning(message: string, duration = 4000): void {
    this.toastSubject.next({ type: 'warning', message, duration });
  }

  showInfo(message: string, duration = 3000): void {
    this.toastSubject.next({ type: 'info', message, duration });
  }

  clear(): void {
    this.toastSubject.next(null);
  }
}
