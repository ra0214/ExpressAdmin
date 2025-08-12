import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SweetAlertService } from '../services/sweet-alert.service';
import { LoginRequest } from '../models/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Logo y Branding -->
        <div class="login-header">
          <img src="assets/logo.jpg" alt="EXPRESS Arte" class="login-logo" (error)="onImageError($event)">
          <h1>Panel de Administración</h1>
          <p>EXPRESS Arte</p>
        </div>

        <!-- Formulario de Login -->
        <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label for="username">
              <i class="fas fa-user"></i>
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              [(ngModel)]="credentials.userName"
              required
              class="form-control"
              placeholder="Ingresa tu usuario"
              autocomplete="username"
              #usernameField="ngModel"
            >
            <div class="error-message" *ngIf="usernameField.invalid && usernameField.touched">
              El usuario es requerido
            </div>
          </div>

          <div class="form-group">
            <label for="password">
              <i class="fas fa-lock"></i>
              Contraseña
            </label>
            <div class="password-input">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                [(ngModel)]="credentials.password"
                required
                class="form-control"
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
                #passwordField="ngModel"
              >
              <button
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
              >
                <i class="fas" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <div class="error-message" *ngIf="passwordField.invalid && passwordField.touched">
              La contraseña es requerida
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn-login"
              [disabled]="loginForm.invalid || loading"
            >
              <i class="fas fa-sign-in-alt" *ngIf="!loading"></i>
              <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
              {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>
          </div>
        </form>

        <!-- Información adicional -->
        <div class="login-footer">
          <div class="security-info">
            <i class="fas fa-shield-alt"></i>
            <span>Acceso seguro y encriptado</span>
          </div>
          <div class="support-info">
            <p>¿Problemas para acceder?</p>
            <a href="mailto:admin@expressarte.com" class="support-link">
              <i class="fas fa-envelope"></i>
              Contactar soporte
            </a>
          </div>
        </div>
      </div>

      <!-- Decoración de fondo -->
      <div class="background-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>
  `,
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = {
    userName: '',
    password: ''
  };

  loading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private sweetAlert: SweetAlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin(): void {
    if (!this.credentials.userName || !this.credentials.password) {
      this.sweetAlert.warning('Datos incompletos', 'Por favor ingresa usuario y contraseña');
      return;
    }

    this.loading = true;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.sweetAlert.success(
          '¡Bienvenido!',
          `Sesión iniciada correctamente como ${response.user.userName}`
        ).then(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (error) => {
        this.loading = false;
        this.sweetAlert.error(
          'Error de autenticación',
          error || 'Credenciales inválidas'
        );
        // Limpiar contraseña en caso de error
        this.credentials.password = '';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
