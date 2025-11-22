import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { ChangePasswordComponent } from '../../components/change-password/change-password.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ChangePasswordComponent, MatBadgeModule, MatIconModule],
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

  /**
   * Lấy initials từ tên người dùng (ví dụ: "Hoàng Duy" -> "HD")
   */
  getInitials(name: string | undefined): string {
    if (!name) return '??';

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
}
