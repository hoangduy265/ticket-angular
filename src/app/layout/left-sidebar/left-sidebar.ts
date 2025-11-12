import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-left-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css',
})
export class LeftSidebar implements OnInit {
  currentUser: any = null;
  expandedMenus: { [key: string]: boolean } = {};

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  toggleSubmenu(menuKey: string) {
    this.expandedMenus[menuKey] = !this.expandedMenus[menuKey];
  }
}
