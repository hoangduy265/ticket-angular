import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { MainPageLayout } from '../main-page-layout/main-page-layout';

@Component({
  selector: 'app-authenticated-layout',
  imports: [Header, Footer, MainPageLayout],
  templateUrl: './authenticated-layout.html',
  styleUrl: './authenticated-layout.css',
})
export class AuthenticatedLayout {}
