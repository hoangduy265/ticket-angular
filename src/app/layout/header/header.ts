import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { ChangePasswordComponent } from '../../components/change-password/change-password.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ChangePasswordComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @ViewChild(ChangePasswordComponent) changePasswordModal!: ChangePasswordComponent;

  currentUser: User | null = null;
  isUserDropdownOpen = false;
  isChangePasswordModalVisible = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.showSuccess('Đăng xuất thành công!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastService.showError('Có lỗi xảy ra khi đăng xuất!');
        console.error('Logout error:', error);
      },
    });
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  openChangePasswordModal(): void {
    this.isChangePasswordModalVisible = true;
    this.isUserDropdownOpen = false; // Close dropdown when opening modal
  }

  onCloseChangePasswordModal(): void {
    this.isChangePasswordModalVisible = false;
  }
}
