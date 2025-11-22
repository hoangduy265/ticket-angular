import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-asigned',
  imports: [],
  templateUrl: './role-asigned.html',
  styleUrl: './role-asigned.css',
})
export class RoleAsigned {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
