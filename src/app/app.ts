import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ToastComponent } from './components/toast.component/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChangePasswordComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('ticket');
}
