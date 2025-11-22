import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      // username: ['', [Validators.required, Validators.minLength(3)]],
      // password: ['', [Validators.required, Validators.minLength(6)]],
      username: '',
      password: '',
    });
  }

  ngOnInit(): void {
    this.checkLocalStorage();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;

      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastService.showSuccess('Đăng nhập thành công!');
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.showError(error.message || 'Đăng nhập thất bại!');
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName === 'username' ? 'Tên đăng nhập' : 'Mật khẩu'} là bắt buộc`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${
        fieldName === 'username' ? 'Tên đăng nhập' : 'Mật khẩu'
      } phải có ít nhất ${minLength} ký tự`;
    }
    return '';
  }

  //Check localstorage for saved username, token and token expiration

  checkLocalStorage(): void {
    const savedUsername = localStorage.getItem(localStorage.getItem('setCurrentUser') || '');
    const savedToken = localStorage.getItem(localStorage.getItem('token') || '');
    const tokenExpiry = localStorage.getItem(localStorage.getItem('expires') || '');
    const resfreshToken = localStorage.getItem(localStorage.getItem('refreshToken') || '');
    const refreshTokenExpires = localStorage.getItem(
      localStorage.getItem('refreshTokenExpires') || ''
    );
    // console.log('Check Local Storage:');
    // console.log('Saved Username:', savedUsername);
    // console.log('Saved Token:', savedToken);
    // console.log('Token Expiry:', tokenExpiry);
    // console.log('Refresh Token:', resfreshToken);
    // console.log('Refresh Token Expiry:', refreshTokenExpires);
  }
}
