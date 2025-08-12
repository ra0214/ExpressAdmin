import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketService } from '../services/websocket.service';
import { SweetAlertService } from '../services/sweet-alert.service';

export interface NotificationItem {
  id: string;
  type: 'product' | 'user' | 'comment' | 'stats';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-panel" [class.open]="isOpen">
      <!-- Toggle Button -->
      <button 
        class="notifications-toggle" 
        (click)="togglePanel()"
        [attr.aria-label]="'Notificaciones' + (unreadCount > 0 ? ' (' + unreadCount + ' nuevas)' : '')">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      </button>

      <!-- Panel Content -->
      <div class="notifications-content" *ngIf="isOpen">
        <div class="notifications-header">
          <h3>
            <i class="fas fa-bell"></i>
            Notificaciones en Tiempo Real
          </h3>
          <div class="header-actions">
            <button 
              class="btn-small" 
              (click)="markAllAsRead()" 
              *ngIf="unreadCount > 0"
              title="Marcar todas como leídas">
              <i class="fas fa-check-double"></i>
            </button>
            <button 
              class="btn-small" 
              (click)="clearAll()" 
              *ngIf="notifications.length > 0"
              title="Limpiar todas">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-close" (click)="closePanel()" title="Cerrar">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="connection-status">
          <span class="status-indicator" [class.connected]="wsConnected" [class.disconnected]="!wsConnected">
            <i class="fas" [class.fa-wifi]="wsConnected" [class.fa-exclamation-triangle]="!wsConnected"></i>
            {{ wsConnected ? 'Conectado en tiempo real' : 'Conexión perdida' }}
          </span>
        </div>

        <div class="notifications-list" *ngIf="notifications.length > 0; else noNotifications">
          <div 
            class="notification-item" 
            *ngFor="let notification of notifications; trackBy: trackByNotification"
            [class.unread]="!notification.read"
            (click)="markAsRead(notification)">
            
            <div class="notification-icon" [style.color]="notification.color">
              <i [class]="notification.icon"></i>
            </div>
            
            <div class="notification-content">
              <h4>{{ notification.title }}</h4>
              <p>{{ notification.message }}</p>
              <small>{{ formatTime(notification.timestamp) }}</small>
            </div>
            
            <div class="notification-status" *ngIf="!notification.read">
              <span class="unread-dot"></span>
            </div>
          </div>
        </div>

        <ng-template #noNotifications>
          <div class="no-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>No hay notificaciones</p>
            <small>Las actualizaciones aparecerán aquí en tiempo real</small>
          </div>
        </ng-template>
      </div>

      <!-- Overlay -->
      <div class="notifications-overlay" *ngIf="isOpen" (click)="closePanel()"></div>
    </div>
  `,
  styles: [`
    .notifications-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .notifications-toggle {
      position: relative;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .notifications-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
    }

    .notification-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff4757;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    .notifications-content {
      position: absolute;
      top: 60px;
      right: 0;
      width: 380px;
      max-height: 600px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      transform: translateY(-10px);
      opacity: 0;
      animation: slideIn 0.3s ease forwards;
    }

    @keyframes slideIn {
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
    }

    .notifications-header h3 {
      margin: 0;
      font-size: 16px;
      color: #495057;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-small, .btn-close {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: rgba(108, 117, 125, 0.1);
      color: #6c757d;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-small:hover, .btn-close:hover {
      background: rgba(108, 117, 125, 0.2);
      color: #495057;
    }

    .connection-status {
      padding: 12px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 500;
    }

    .status-indicator.connected {
      background: rgba(67, 233, 123, 0.1);
      color: #43e97b;
    }

    .status-indicator.disconnected {
      background: rgba(255, 107, 107, 0.1);
      color: #ff6b6b;
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px 20px;
      border-bottom: 1px solid #f1f3f4;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .notification-item:hover {
      background: #f8f9fa;
    }

    .notification-item.unread {
      background: rgba(102, 126, 234, 0.05);
      border-left: 3px solid #667eea;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(102, 126, 234, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
    }

    .notification-content h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
    }

    .notification-content p {
      margin: 0 0 6px 0;
      font-size: 13px;
      color: #7f8c8d;
      line-height: 1.4;
    }

    .notification-content small {
      font-size: 12px;
      color: #95a5a6;
    }

    .notification-status {
      display: flex;
      align-items: center;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
    }

    .no-notifications {
      text-align: center;
      padding: 40px 20px;
      color: #7f8c8d;
    }

    .no-notifications i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-notifications p {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .no-notifications small {
      font-size: 14px;
      opacity: 0.7;
    }

    .notifications-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      z-index: -1;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* Scrollbar styling */
    .notifications-list::-webkit-scrollbar {
      width: 6px;
    }

    .notifications-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .notifications-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .notifications-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notifications-panel {
        right: 15px;
        top: 15px;
      }

      .notifications-content {
        width: calc(100vw - 30px);
        max-width: 350px;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  isOpen = false;
  wsConnected = false;
  notifications: NotificationItem[] = [];
  unreadCount = 0;

  constructor(
    private webSocketService: WebSocketService,
    private sweetAlert: SweetAlertService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initWebSocket(): void {
    if (this.isBrowser) {
      // Escuchar estado de conexión
      this.webSocketService.getConnectionStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe(connected => {
          this.wsConnected = connected;
        });

      // Escuchar todas las actualizaciones y crear notificaciones
      this.webSocketService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe(message => {
          this.createNotification(message);
        });
    }
  }

  private createNotification(message: any): void {
    let notification: NotificationItem;

    switch (message.type) {
      case 'product_created':
        notification = {
          id: Date.now() + Math.random().toString(),
          type: 'product',
          title: 'Nuevo Producto',
          message: `Se ha creado el producto "${message.data.name}"`,
          timestamp: new Date(),
          read: false,
          icon: 'fas fa-plus-circle',
          color: '#43e97b'
        };
        break;

      case 'product_update':
        notification = {
          id: Date.now() + Math.random().toString(),
          type: 'product',
          title: 'Producto Actualizado',
          message: `Se ha actualizado el producto "${message.data.name}"`,
          timestamp: new Date(),
          read: false,
          icon: 'fas fa-edit',
          color: '#667eea'
        };
        break;

      case 'product_deleted':
        notification = {
          id: Date.now() + Math.random().toString(),
          type: 'product',
          title: 'Producto Eliminado',
          message: `Se ha eliminado un producto`,
          timestamp: new Date(),
          read: false,
          icon: 'fas fa-trash',
          color: '#ff6b6b'
        };
        break;

      case 'comment_created':
        notification = {
          id: Date.now() + Math.random().toString(),
          type: 'comment',
          title: 'Nuevo Comentario',
          message: `${message.data.user_name} ha comentado (${message.data.rating}★)`,
          timestamp: new Date(),
          read: false,
          icon: 'fas fa-comment',
          color: '#4facfe'
        };
        break;

      case 'user_registered':
        notification = {
          id: Date.now() + Math.random().toString(),
          type: 'user',
          title: 'Nuevo Usuario',
          message: `Se ha registrado: ${message.data.userName}`,
          timestamp: new Date(),
          read: false,
          icon: 'fas fa-user-plus',
          color: '#f093fb'
        };
        break;

      default:
        return;
    }

    // Agregar la notificación al inicio del array
    this.notifications.unshift(notification);
    this.updateUnreadCount();

    // Limitar a 50 notificaciones máximo
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  closePanel(): void {
    this.isOpen = false;
  }

  markAsRead(notification: NotificationItem): void {
    if (!notification.read) {
      notification.read = true;
      this.updateUnreadCount();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
  }

  clearAll(): void {
    this.sweetAlert.confirm(
      '¿Limpiar notificaciones?',
      'Se eliminarán todas las notificaciones'
    ).then((result) => {
      if (result.isConfirmed) {
        this.notifications = [];
        this.unreadCount = 0;
        this.sweetAlert.success('Limpiado', 'Todas las notificaciones han sido eliminadas');
      }
    });
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    
    return timestamp.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByNotification(index: number, notification: NotificationItem): string {
    return notification.id;
  }
}
