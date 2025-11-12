import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  @Input() isVisible = false;
  @Output() closeEvent = new EventEmitter<void>();

  changePasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  closeModal(): void {
    this.isVisible = false;
    this.closeEvent.emit();
    this.changePasswordForm.reset();
  }

  openModal(): void {
    this.isVisible = true;
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      // TODO: Implement when API is available
      // const { currentPassword, newPassword } = this.changePasswordForm.value;
      // this.authService.changePassword({ currentPassword, newPassword }).subscribe(...)

      // Simulate API call
      setTimeout(() => {
        this.toastService.showSuccess('Đổi mật khẩu thành công!');
        this.isLoading = false;
        this.closeModal();
      }, 1500);
    }
  }
}
