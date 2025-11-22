import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { Contact } from './pages/contact/contact';
import { News } from './pages/news/news';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [LoginGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/authenticated-layout/authenticated-layout').then(
        (m) => m.AuthenticatedLayout
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'contact',
        loadComponent: () => {
          return import('./pages/contact/contact').then((m) => m.Contact);
        },
      },
      {
        path: 'news',
        loadComponent: () => {
          return import('./pages/news/news').then((m) => m.News);
        },
      },
      {
        path: 'role-asigned',
        loadComponent: () => {
          return import('./pages/role-asigned/role-asigned').then((m) => m.RoleAsigned);
        },
      },
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
