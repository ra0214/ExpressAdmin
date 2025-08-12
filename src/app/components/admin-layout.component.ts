import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { FooterComponent } from './footer.component';
import { NotificationsComponent } from './notifications.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, FooterComponent, NotificationsComponent],
  template: `
    <div class="admin-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
          <app-footer></app-footer>
        </div>
      </div>
      <!-- Componente de notificaciones flotante -->
      <app-notifications></app-notifications>
    </div>
  `,
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {}
