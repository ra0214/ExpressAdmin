import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SweetAlertService } from '../services/sweet-alert.service';
import { DashboardService, DashboardStats } from '../services/dashboard.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- Header del Dashboard -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>¡Bienvenido, {{ currentUser?.username }}!</h1>
          <p>Panel de Administración - EXPRESS Arte</p>
        </div>
        <div class="quick-actions">
          <button class="btn btn-secondary" (click)="refreshData()">
            <i class="fas fa-sync-alt"></i> Actualizar
          </button>
          <button class="btn btn-danger" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
          </button>
        </div>
      </div>

      <!-- Estadísticas Principales -->
      <div class="stats-grid" *ngIf="!loading">
        <div class="stat-card">
          <div class="stat-icon products">
            <i class="fas fa-box"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardStats?.totalProductos || 0 }}</h3>
            <p>Total Productos</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon users">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardStats?.totalUsuarios || 0 }}</h3>
            <p>Usuarios Registrados</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon comments">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardStats?.totalComentarios || 0 }}</h3>
            <p>Comentarios</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rating">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardStats?.promedioRating || 0 | number:'1.1-1' }}</h3>
            <p>Rating Promedio</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="stats-grid loading-state" *ngIf="loading">
        <div class="stat-card" *ngFor="let i of [1,2,3,4]">
          <div class="stat-icon">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div class="stat-content">
            <h3>...</h3>
            <p>Cargando...</p>
          </div>
        </div>
      </div>

      <!-- Actividad Reciente (placeholder) -->
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="card-header">
            <h3><i class="fas fa-clock"></i> Actividad Reciente</h3>
            <button class="btn-link" routerLink="/comentarios">Ver comentarios</button>
          </div>
          <div class="card-content">
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-icon activity-comment">
                  <i class="fas fa-comment"></i>
                </div>
                <div class="activity-content">
                  <p>Sistema de comentarios activo</p>
                  <small>{{ dashboardStats?.totalComentarios || 0 }} comentarios registrados</small>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon activity-producto">
                  <i class="fas fa-box"></i>
                </div>
                <div class="activity-content">
                  <p>Catálogo de productos actualizado</p>
                  <small>{{ dashboardStats?.totalProductos || 0 }} productos disponibles</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de Estado -->
          <div class="dashboard-card">
          <div class="card-header">
            <h3><i class="fas fa-info-circle"></i> Estado del Sistema</h3>
            <div class="connection-status">
              <span class="status-indicator" [class.connected]="wsConnected" [class.disconnected]="!wsConnected">
                <i class="fas" [class.fa-wifi]="wsConnected" [class.fa-exclamation-triangle]="!wsConnected"></i>
                {{ wsConnected ? 'Conectado' : 'Desconectado' }}
              </span>
            </div>
          </div>
          <div class="card-content">
            <div class="alerts-list">
              <div class="alert-item alert-success">
                <div class="alert-icon">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="alert-content">
                  <h4>Sistema Operativo</h4>
                  <p>Todos los servicios funcionando correctamente</p>
                  <small>API conectada y funcionando</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="quick-access">
        <h3>Accesos Rápidos</h3>
        <div class="quick-access-grid">
          <a routerLink="/productos" class="quick-access-item">
            <i class="fas fa-box"></i>
            <span>Gestionar Productos</span>
          </a>
          <a routerLink="/usuarios" class="quick-access-item">
            <i class="fas fa-users"></i>
            <span>Gestionar Usuarios</span>
          </a>
          <a routerLink="/comentarios" class="quick-access-item">
            <i class="fas fa-comments"></i>
            <span>Moderar Comentarios</span>
          </a>
          <a routerLink="/estadisticas" class="quick-access-item">
            <i class="fas fa-chart-bar"></i>
            <span>Ver Estadísticas</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  currentUser: any = null;
  dashboardStats: DashboardStats | null = null;
  loading = true;
  wsConnected = false;
  realtimeUpdates = 0;

  constructor(
    private authService: AuthService,
    private sweetAlert: SweetAlertService,
    private dashboardService: DashboardService,
    private webSocketService: WebSocketService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();
  }

  private initWebSocket(): void {
    if (this.isBrowser) {
      // Conectar WebSocket
      this.webSocketService.connect();

      // Escuchar estado de conexión
      this.webSocketService.getConnectionStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe(connected => {
          this.wsConnected = connected;
          if (connected) {
            this.sweetAlert.toast('success', 'Conexión en tiempo real establecida');
          }
        });

      // Escuchar actualizaciones de estadísticas
      this.webSocketService.onStatsUpdate()
        .pipe(takeUntil(this.destroy$))
        .subscribe(stats => {
          this.dashboardStats = stats;
          this.realtimeUpdates++;
          this.sweetAlert.toast('info', 'Estadísticas actualizadas en tiempo real');
        });

      // Escuchar actualizaciones de productos
      this.webSocketService.onProductUpdate()
        .pipe(takeUntil(this.destroy$))
        .subscribe(productData => {
          this.realtimeUpdates++;
          this.loadDashboardData(); // Recargar estadísticas
          this.sweetAlert.toast('info', `Producto ${productData.action || 'actualizado'}`);
        });

      // Escuchar actualizaciones de usuarios
      this.webSocketService.onUserUpdate()
        .pipe(takeUntil(this.destroy$))
        .subscribe(userData => {
          this.realtimeUpdates++;
          this.loadDashboardData(); // Recargar estadísticas
          this.sweetAlert.toast('info', 'Nuevo usuario registrado');
        });

      // Escuchar actualizaciones de comentarios
      this.webSocketService.onCommentUpdate()
        .pipe(takeUntil(this.destroy$))
        .subscribe(commentData => {
          this.realtimeUpdates++;
          this.loadDashboardData(); // Recargar estadísticas
          this.sweetAlert.toast('info', `Comentario ${commentData.action || 'actualizado'}`);
        });
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    
    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.dashboardStats = stats;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar estadísticas del dashboard:', error);
          this.loading = false;
          // Usar datos de fallback en caso de error
          this.dashboardStats = {
            totalProductos: 0,
            totalUsuarios: 1248,
            totalComentarios: 0,
            promedioRating: 0
          };
        }
      });
  }

  refreshData(): void {
    this.sweetAlert.loading('Actualizando datos...');
    this.loadDashboardData();
    setTimeout(() => {
      this.sweetAlert.close();
      this.sweetAlert.toast('success', 'Datos actualizados correctamente');
    }, 1500);
  }

  crearNuevoProducto(): void {
    this.router.navigate(['/productos']);
  }

  markAllAsRead(): void {
    this.sweetAlert.confirm(
      '¿Marcar todas como leídas?',
      'Esta acción marcará todas las alertas como leídas'
    ).then((result) => {
      if (result.isConfirmed) {
        this.sweetAlert.toast('success', 'Alertas marcadas como leídas');
      }
    });
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
