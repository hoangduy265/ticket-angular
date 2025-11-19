import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
  active: boolean;
}

@Component({
  selector: 'app-main-page-layout',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './main-page-layout.html',
  styleUrl: './main-page-layout.css',
})
export class MainPageLayout implements OnInit {
  breadcrumbs: Breadcrumb[] = [];

  private routeLabels: { [key: string]: string } = {
    '/home': '> Trang chủ',
    '/contact': '> Liên hệ',
    '/news': '> Tin tức',
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Update breadcrumbs khi route thay đổi
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.createBreadcrumbs())
      )
      .subscribe((breadcrumbs) => {
        this.breadcrumbs = breadcrumbs;
      });

    // Set initial breadcrumbs
    this.breadcrumbs = this.createBreadcrumbs();
  }

  private createBreadcrumbs(): Breadcrumb[] {
    const currentUrl = this.router.url.split('?')[0]; // Loại bỏ query params
    const breadcrumbs: Breadcrumb[] = [
      {
        label: 'Home',
        url: '/home',
        active: false,
      },
    ];

    if (currentUrl !== '/home' && currentUrl !== '/') {
      const label = this.routeLabels[currentUrl] || currentUrl.substring(1);
      breadcrumbs.push({
        label: label,
        url: currentUrl,
        active: true,
      });
    } else {
      breadcrumbs[0].active = true;
    }

    return breadcrumbs;
  }
}
