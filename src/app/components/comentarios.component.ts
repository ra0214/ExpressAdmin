import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComentariosService, Comentario } from '../services/comentarios.service';
import { SweetAlertService } from '../services/sweet-alert.service';
import { ProductosService } from '../services/productos.service';
import { WebSocketService } from '../services/websocket.service';
import { HeaderComponent } from './header.component';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="comentarios-container">
      <div class="header">
        <h2>
          <i class="fas fa-comments"></i> Gestión de Comentarios
          <span class="ws-status" [class.connected]="wsConnected" [class.disconnected]="!wsConnected">
            <i class="fas fa-wifi" *ngIf="wsConnected" title="WebSocket conectado"></i>
            <i class="fas fa-exclamation-triangle" *ngIf="!wsConnected" title="WebSocket desconectado"></i>
          </span>
        </h2>
        <button class="btn-actualizar" (click)="cargarDatos()" [disabled]="loading">
          <i class="fas fa-sync-alt" [class.fa-spin]="loading"></i>
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <i class="fas fa-comment"></i>
          <div>
            <span class="number">{{ comentarios.length }}</span>
            <span class="label">Total Comentarios</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-star"></i>
          <div>
            <span class="number">{{ promedioCalificacion.toFixed(1) }}</span>
            <span class="label">Calificación Promedio</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-calendar-week"></i>
          <div>
            <span class="number">{{ comentariosRecientes }}</span>
            <span class="label">Esta Semana</span>
          </div>
        </div>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label for="filtroCalificacion">Filtrar por calificación:</label>
          <select id="filtroCalificacion" [(ngModel)]="filtroCalificacion" (change)="aplicarFiltros()">
            <option value="">Todas</option>
            <option value="5">5 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="2">2 estrellas</option>
            <option value="1">1 estrella</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="ordenamiento">Ordenar por:</label>
          <select id="ordenamiento" [(ngModel)]="ordenamiento" (change)="aplicarOrdenamiento()">
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="rating-alto">Calificación alta</option>
            <option value="rating-bajo">Calificación baja</option>
          </select>
        </div>
        <div class="search-group">
          <input 
            type="text" 
            placeholder="Buscar en comentarios..." 
            [(ngModel)]="busqueda"
            (input)="aplicarFiltros()"
          >
          <i class="fas fa-search"></i>
        </div>
      </div>

      <div class="comentarios-grid" *ngIf="!loading">
        <div class="comentario-card" *ngFor="let comentario of comentariosFiltrados">
          <div class="comentario-header">
            <div class="producto-info">
              <h4>{{ comentario.nombre_producto || 'Producto #' + comentario.product_id }}</h4>
              <span class="fecha">{{ formatDate(comentario.created_at) }}</span>
            </div>
            <div class="acciones">
              <button class="btn-eliminar" (click)="eliminarComentario(comentario.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="calificacion">
            <div class="estrellas">
              <i class="fas fa-star" 
                 *ngFor="let star of [1,2,3,4,5]" 
                 [class.active]="star <= comentario.rating">
              </i>
            </div>
            <span class="calificacion-numero">({{ comentario.rating }}/5)</span>
          </div>
          
          <div class="comentario-contenido">
            <p>{{ comentario.comment }}</p>
          </div>
          
          <div class="comentario-footer">
            <span class="usuario">
              <i class="fas fa-user"></i>
              {{ comentario.user_name || 'Usuario Anónimo' }}
            </span>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando comentarios...</p>
      </div>

      <div class="no-data" *ngIf="!loading && comentariosFiltrados.length === 0">
        <i class="fas fa-comment-slash"></i>
        <p>No se encontraron comentarios</p>
      </div>
    </div>
  `,
  styles: [`
    .comentarios-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header h2 {
      color: var(--primary-color);
      margin: 0;
      font-size: 1.8rem;
    }

    .btn-actualizar {
      background: var(--accent-color);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-actualizar:hover:not(:disabled) {
      background: #27ae60;
    }

    .btn-actualizar:disabled {
      background: #95a5a6;
      cursor: not-allowed;
    }

    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .stat-card {
      background: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
      min-width: 150px;
    }

    .stat-card i {
      font-size: 1.5rem;
      color: var(--accent-color);
    }

    .stat-card .number {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-color);
    }

    .stat-card .label {
      display: block;
      font-size: 0.9rem;
      color: #666;
    }

    .filters {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .filter-group label {
      font-weight: 500;
      color: var(--text-color);
    }

    .filter-group select {
      padding: 8px 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .search-group {
      position: relative;
      flex-grow: 1;
      max-width: 300px;
    }

    .search-group input {
      width: 100%;
      padding: 10px 40px 10px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 25px;
      font-size: 0.9rem;
    }

    .search-group i {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .comentarios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .comentario-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .comentario-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 25px rgba(0,0,0,0.15);
    }

    .comentario-header {
      padding: 20px 20px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .producto-info h4 {
      margin: 0 0 5px 0;
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    .fecha {
      font-size: 0.8rem;
      color: #666;
    }

    .acciones {
      display: flex;
      gap: 10px;
    }

    .btn-eliminar {
      background: #dc3545;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .btn-eliminar:hover {
      background: #c82333;
    }

    .calificacion {
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 15px 0;
    }

    .estrellas {
      display: flex;
      gap: 2px;
    }

    .estrellas i {
      color: #ddd;
      font-size: 0.9rem;
    }

    .estrellas i.active {
      color: #ffc107;
    }

    .calificacion-numero {
      font-size: 0.9rem;
      color: #666;
    }

    .comentario-contenido {
      padding: 0 20px;
      margin: 15px 0;
    }

    .comentario-contenido p {
      margin: 0;
      line-height: 1.6;
      color: var(--text-color);
    }

    .comentario-footer {
      padding: 15px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }

    .usuario {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #666;
    }

    .loading, .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .loading i, .no-data i {
      font-size: 3rem;
      margin-bottom: 20px;
      color: var(--accent-color);
    }

    .loading p, .no-data p {
      font-size: 1.1rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .comentarios-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .stats {
        justify-content: center;
      }
      
      .filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-group {
        max-width: none;
      }
    }
  `]
})
export class ComentariosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  comentarios: Comentario[] = [];
  comentariosFiltrados: Comentario[] = [];
  loading = true;
  filtroCalificacion = '';
  busqueda = '';
  ordenamiento = 'recientes';
  promedioCalificacion = 0;
  comentariosRecientes = 0;
  productos: any[] = [];
  
  // WebSocket
  wsConnected = false;
  private isBrowser: boolean;

  constructor(
    private comentariosService: ComentariosService,
    private sweetAlert: SweetAlertService,
    private productosService: ProductosService,
    private webSocketService: WebSocketService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.cargarDatos();
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
          console.log('🔗 WebSocket conectado en Comentarios:', connected);
        });

      // Escuchar actualizaciones de comentarios
      this.webSocketService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe(message => {
          if (message.type.includes('comment')) {
            console.log('📨 Actualización de comentario recibida:', message);
            this.cargarDatos(); // Recargar comentarios cuando hay cambios
          }
        });
    }
  }

  cargarDatos(): void {
    this.loading = true;
    console.log('🔄 Iniciando carga de datos...'); // Debug temporal
    
    // Primero probar la conexión
    this.comentariosService.testConnection().subscribe({
      next: (response) => {
        console.log('✅ Conexión exitosa, cargando datos completos...'); // Debug temporal
        this.cargarDatosCompletos();
      },
      error: (error) => {
        console.error('❌ Error de conexión inicial:', error); // Debug temporal
        this.loading = false;
        
        // Mostrar error más específico
        let errorMsg = 'Error de conexión';
        if (error.status === 0) {
          errorMsg = 'No se puede conectar al servidor. Verifica que la API esté ejecutándose en http://localhost:8080';
        } else if (error.status === 404) {
          errorMsg = 'El endpoint /api/comments no existe en el servidor';
        } else {
          errorMsg = `Error ${error.status}: ${error.message}`;
        }
        
        this.sweetAlert.error('Error de Conexión', errorMsg);
      }
    });
  }

  cargarDatosCompletos(): void {
    // Cargar productos y comentarios simultáneamente
    forkJoin({
      productos: this.productosService.getAllProductos(),
      comentarios: this.comentariosService.getAllComentarios()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ productos, comentarios }) => {
        this.productos = productos;
        
        // Enriquecer comentarios con información del producto
        this.comentarios = comentarios.map((comentario: any) => {
          const producto = this.productos.find(p => p.id === comentario.product_id);
          return {
            ...comentario,
            nombre_producto: producto ? producto.name : `Producto #${comentario.product_id}`
          };
        });
        
        this.comentariosFiltrados = [...this.comentarios];
        this.calcularPromedioCalificacion();
        this.calcularComentariosRecientes();
        this.aplicarOrdenamiento();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar datos:', error);
        this.loading = false;
        this.sweetAlert.error('Error', `No se pudieron cargar los datos: ${error}`);
      }
    });
  }

  aplicarFiltros(): void {
    this.comentariosFiltrados = this.comentarios.filter(comentario => {
      const coincideBusqueda = !this.busqueda || 
        comentario.comment.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        (comentario.nombre_producto && comentario.nombre_producto.toLowerCase().includes(this.busqueda.toLowerCase()));
      
      const coincideCalificacion = !this.filtroCalificacion || 
        comentario.rating.toString() === this.filtroCalificacion;

      return coincideBusqueda && coincideCalificacion;
    });
    
    // Aplicar ordenamiento después del filtrado
    this.aplicarOrdenamiento();
  }

  calcularPromedioCalificacion(): void {
    if (this.comentarios.length === 0) {
      this.promedioCalificacion = 0;
      return;
    }

    const suma = this.comentarios.reduce((acc, comentario) => acc + comentario.rating, 0);
    this.promedioCalificacion = suma / this.comentarios.length;
  }

  calcularComentariosRecientes(): void {
    const unaSemanAtras = new Date();
    unaSemanAtras.setDate(unaSemanAtras.getDate() - 7);
    
    this.comentariosRecientes = this.comentarios.filter(comentario => {
      const fechaComentario = new Date(comentario.created_at);
      return fechaComentario >= unaSemanAtras;
    }).length;
  }

  aplicarOrdenamiento(): void {
    switch (this.ordenamiento) {
      case 'recientes':
        this.comentariosFiltrados.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'antiguos':
        this.comentariosFiltrados.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'rating-alto':
        this.comentariosFiltrados.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-bajo':
        this.comentariosFiltrados.sort((a, b) => a.rating - b.rating);
        break;
    }
  }

  eliminarComentario(id: number): void {
    this.sweetAlert.confirm(
      '¿Eliminar comentario?',
      'Esta acción no se puede deshacer'
    ).then((result) => {
      if (result.isConfirmed) {
        this.comentariosService.eliminarComentario(id).subscribe({
          next: () => {
            // Recargar todos los datos después de eliminar
            this.cargarDatos();
            this.sweetAlert.success('Eliminado', 'Comentario eliminado correctamente');
          },
          error: (error) => {
            this.sweetAlert.error('Error', 'No se pudo eliminar el comentario');
            console.error('Error al eliminar comentario:', error);
          }
        });
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
