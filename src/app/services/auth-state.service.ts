import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private loggedOut = false;

  setLoggedOut(value: boolean): void {
    this.loggedOut = value;
  }

  isLoggedOutFlag(): boolean {
    return this.loggedOut;
  }

  resetLogoutFlag(): void {
    this.loggedOut = false;
  }
}