import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Usuario, LoginRequest, LoginResponse } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1';
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar si hay un usuario logueado al inicializar (solo en el browser)
    if (isPlatformBrowser(this.platformId)) {
      this.checkStoredAuth();
    }
  }

  // Verificar autenticación almacenada
  private checkStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  // Login de administrador
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.user && isPlatformBrowser(this.platformId)) {
            // Como no hay token JWT, usamos el ID del usuario como token temporal
            const tempToken = `user_${response.user.id}_${Date.now()}`;
            localStorage.setItem('admin_token', tempToken);
            localStorage.setItem('admin_user', JSON.stringify({
              id: response.user.id,
              username: response.user.userName,
              email: response.user.email,
              role: 'admin', // Asumimos que es admin por defecto
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              activo: true
            }));
            this.currentUserSubject.next({
              id: response.user.id,
              username: response.user.userName,
              email: response.user.email,
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              activo: true
            });
          }
        }),
        catchError(this.handleError)
      );
  }

  // Logout
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
    this.currentUserSubject.next(null);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const token = localStorage.getItem('admin_token');
    return !!token;
  }

  // Verificar si es administrador
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  // Obtener token
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('admin_token');
  }

  // Obtener usuario actual
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Actualizar perfil
  updateProfile(userData: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/admin/profile`, userData)
      .pipe(
        tap(user => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('admin_user', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  // Cambiar contraseña
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 401:
          errorMessage = 'Credenciales inválidas';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || 'Error de conexión';
      }
    }
    
    return throwError(() => errorMessage);
  }
}
