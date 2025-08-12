import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private reconnectInterval = 5000; // 5 segundos
  private maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  connect(): void {
    if (!this.isBrowser) {
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // URL del WebSocket de la API
      const wsUrl = environment.production 
        ? 'wss://your-api-domain.com/ws' 
        : environment.wsUrl || 'ws://localhost:8080/ws';
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('🔗 WebSocket conectado');
        this.connectionSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Mensaje WebSocket recibido:', message);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('❌ Error al parsear mensaje WebSocket:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.connectionSubject.next(false);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        this.connectionSubject.next(false);
      };

    } catch (error) {
      console.error('❌ Error al conectar WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reintentando conexión WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Máximo número de reintentos alcanzado');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }

  // Observable para escuchar mensajes
  getMessages(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  // Observable para el estado de conexión
  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  // Métodos específicos para tipos de mensajes
  onProductUpdate(): Observable<any> {
    return new Observable(observer => {
      this.getMessages().subscribe(message => {
        if (message.type === 'product_update' || message.type === 'product_created' || message.type === 'product_deleted') {
          observer.next(message.data);
        }
      });
    });
  }

  onUserUpdate(): Observable<any> {
    return new Observable(observer => {
      this.getMessages().subscribe(message => {
        if (message.type === 'user_update' || message.type === 'user_registered') {
          observer.next(message.data);
        }
      });
    });
  }

  onCommentUpdate(): Observable<any> {
    return new Observable(observer => {
      this.getMessages().subscribe(message => {
        if (message.type === 'comment_created' || message.type === 'comment_updated' || message.type === 'comment_deleted') {
          observer.next(message.data);
        }
      });
    });
  }

  onStatsUpdate(): Observable<any> {
    return new Observable(observer => {
      this.getMessages().subscribe(message => {
        if (message.type === 'stats_update') {
          observer.next(message.data);
        }
      });
    });
  }
}