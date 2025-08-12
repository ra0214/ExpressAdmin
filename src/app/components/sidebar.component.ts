import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SweetAlertService } from '../services/sweet-alert.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar">
      <!-- Logo y Título -->
      <div class="sidebar-header">
        <div class="logo">
          <i class="fas fa-palette"></i>
        </div>
        <h2>EXPRESS Arte</h2>
        <p>Panel Admin</p>
      </div>

      <!-- Información del Usuario -->
      <div class="user-info">
        <div class="user-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
          <h4>{{ currentUser?.username || 'Administrador' }}</h4>
          <span>Administrador</span>
        </div>
      </div>

      <!-- Navegación Principal -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <h5>Principal</h5>
          <ul>
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <h5>Gestión</h5>
          <ul>
            <li>
              <a routerLink="/productos" routerLinkActive="active">
                <i class="fas fa-box"></i>
                <span>Productos</span>
              </a>
            </li>
            <li>
              <a routerLink="/usuarios" routerLinkActive="active">
                <i class="fas fa-users"></i>
                <span>Usuarios</span>
              </a>
            </li>
            <li>
              <a routerLink="/comentarios" routerLinkActive="active">
                <i class="fas fa-comments"></i>
                <span>Comentarios</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <h5>Reportes</h5>
          <ul>
            <li>
              <a routerLink="/estadisticas" routerLinkActive="active">
                <i class="fas fa-chart-bar"></i>
                <span>Estadísticas</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Botón de Cerrar Sesión -->
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `,
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private sweetAlert: SweetAlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  logout(): void {
    this.sweetAlert.confirm(
      '¿Cerrar sesión?',
      'Se cerrará tu sesión actual'
    ).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.sweetAlert.toast('success', 'Sesión cerrada correctamente');
        this.router.navigate(['/login']);
      }
    });
  }
}
