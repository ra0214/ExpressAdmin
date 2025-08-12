import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComentariosService, EstadisticasComentarios } from '../services/comentarios.service';
import { ProductosService, EstadisticasProductos } from '../services/productos.service';
import { SweetAlertService } from '../services/sweet-alert.service';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="estadisticas-container">
      <div class="header">
        <h2><i class="fas fa-chart-bar"></i> Estadísticas del Sistema</h2>
        <button class="btn-actualizar" (click)="actualizarEstadisticas()">
          <i class="fas fa-sync-alt" [class.fa-spin]="actualizando"></i>
          Actualizar
        </button>
      </div>

      <!-- Estadísticas Generales -->
      <div class="stats-grid">
        <div class="stat-card resumen">
          <div class="stat-header">
            <i class="fas fa-tachometer-alt"></i>
            <h3>Resumen General</h3>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Total Productos:</span>
              <span class="value">{{ estadisticasProductos?.totalProductos || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Total Comentarios:</span>
              <span class="value">{{ estadisticasComentarios?.totalComentarios || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Calificación Promedio:</span>
              <span class="value rating">
                {{ (estadisticasComentarios?.promedioCalificacion || 0).toFixed(1) }}
                <i class="fas fa-star"></i>
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card productos">
          <div class="stat-header">
            <i class="fas fa-boxes"></i>
            <h3>Productos</h3>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Productos Activos:</span>
              <span class="value success">{{ estadisticasProductos?.productosActivos || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Sin Stock:</span>
              <span class="value warning">{{ estadisticasProductos?.productosSinStock || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Precio Promedio:</span>
              <span class="value">\${{ (estadisticasProductos?.promedioPrecios || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card comentarios">
          <div class="stat-header">
            <i class="fas fa-comments"></i>
            <h3>Comentarios Recientes</h3>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Últimos 7 días:</span>
              <span class="value">{{ estadisticasComentarios?.comentariosRecientes || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Promedio por Producto:</span>
              <span class="value">{{ calcularPromedioComentariosPorProducto() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribución de Calificaciones -->
      <div class="chart-section">
        <div class="chart-card">
          <h3><i class="fas fa-star"></i> Distribución de Calificaciones</h3>
          <div class="rating-chart">
            <div class="rating-bar" *ngFor="let rating of [5,4,3,2,1]">
              <div class="rating-label">
                <span>{{ rating }}</span>
                <div class="stars">
                  <i class="fas fa-star" *ngFor="let star of getStarsArray(rating)"></i>
                </div>
              </div>
              <div class="bar-container">
                <div class="bar" 
                     [style.width.%]="getCalificacionPorcentaje(rating)"
                     [class]="'rating-' + rating">
                </div>
              </div>
              <div class="rating-count">
                {{ getCalificacionCount(rating) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Productos Populares -->
        <div class="chart-card">
          <h3><i class="fas fa-trophy"></i> Productos Populares</h3>
          <div class="productos-populares" *ngIf="estadisticasProductos?.productosPopulares?.length">
            <div class="producto-popular" *ngFor="let producto of estadisticasProductos?.productosPopulares; let i = index">
              <div class="posicion">{{ i + 1 }}</div>
              <div class="info">
                <h4>{{ producto.nombre }}</h4>
                <div class="metrics">
                  <span class="comentarios">
                    <i class="fas fa-comments"></i>
                    {{ producto.comentarios }} comentarios
                  </span>
                  <span class="calificacion">
                    <i class="fas fa-star"></i>
                    {{ producto.calificacion.toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="no-data" *ngIf="!estadisticasProductos?.productosPopulares?.length">
            <i class="fas fa-chart-line"></i>
            <p>No hay datos de productos populares</p>
          </div>
        </div>
      </div>

      <!-- Tendencias -->
      <div class="trends-section">
        <div class="trend-card">
          <div class="trend-header">
            <i class="fas fa-trending-up"></i>
            <h3>Tendencias</h3>
          </div>
          <div class="trend-content">
            <div class="trend-item">
              <div class="trend-icon success">
                <i class="fas fa-arrow-up"></i>
              </div>
              <div class="trend-info">
                <h4>Actividad de Comentarios</h4>
                <p>{{ getTendenciaComentarios() }}</p>
              </div>
            </div>
            <div class="trend-item">
              <div class="trend-icon" [class]="getIconoTendenciaStock()">
                <i class="fas" [class]="getIconoStock()"></i>
              </div>
              <div class="trend-info">
                <h4>Estado del Inventario</h4>
                <p>{{ getTendenciaStock() }}</p>
              </div>
            </div>
            <div class="trend-item">
              <div class="trend-icon info">
                <i class="fas fa-star"></i>
              </div>
              <div class="trend-info">
                <h4>Satisfacción del Cliente</h4>
                <p>{{ getSatisfaccionCliente() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando estadísticas...</p>
      </div>
    </div>
  `,
  styles: [`
    .estadisticas-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
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
    }

    .btn-actualizar:hover {
      background: #27ae60;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 25px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .stat-header {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stat-header i {
      font-size: 1.5rem;
    }

    .stat-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .stat-content {
      padding: 20px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-item .label {
      font-weight: 500;
      color: #666;
    }

    .stat-item .value {
      font-weight: bold;
      font-size: 1.1rem;
      color: var(--primary-color);
    }

    .value.success {
      color: #28a745;
    }

    .value.warning {
      color: #ffc107;
    }

    .value.rating {
      color: #ffc107;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .chart-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 30px;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      padding: 25px;
    }

    .chart-card h3 {
      margin: 0 0 20px 0;
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .rating-chart {
      padding: 10px 0;
    }

    .rating-bar {
      display: grid;
      grid-template-columns: 100px 1fr 60px;
      gap: 15px;
      align-items: center;
      margin-bottom: 18px;
      padding: 8px 0;
    }

    .rating-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      min-width: 100px;
    }

    .rating-label span {
      font-size: 1rem;
      min-width: 12px;
      text-align: right;
    }

    .stars {
      display: flex;
      gap: 3px;
      margin-left: 5px;
    }

    .stars i {
      color: #ffc107;
      font-size: 0.75rem;
    }

    .bar-container {
      background: #f0f0f0;
      height: 10px;
      border-radius: 5px;
      overflow: hidden;
      margin: 0 5px;
    }

    .bar {
      height: 100%;
      border-radius: 5px;
      transition: width 0.5s ease;
      min-width: 2px;
    }

    .bar.rating-5 { background: #28a745; }
    .bar.rating-4 { background: #6c757d; }
    .bar.rating-3 { background: #ffc107; }
    .bar.rating-2 { background: #fd7e14; }
    .bar.rating-1 { background: #dc3545; }

    .rating-count {
      text-align: center;
      font-weight: 500;
      color: #666;
      min-width: 60px;
      font-size: 0.9rem;
    }

    .productos-populares {
      space-y: 15px;
    }

    .producto-popular {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .posicion {
      background: var(--accent-color);
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .info h4 {
      margin: 0 0 5px 0;
      color: var(--primary-color);
      font-size: 1rem;
    }

    .metrics {
      display: flex;
      gap: 15px;
      font-size: 0.9rem;
      color: #666;
    }

    .metrics span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .trends-section {
      margin-bottom: 30px;
    }

    .trend-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .trend-header {
      background: linear-gradient(135deg, #6c757d, #495057);
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .trend-content {
      padding: 25px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 25px;
    }

    .trend-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .trend-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
    }

    .trend-icon.success { background: #28a745; }
    .trend-icon.warning { background: #ffc107; }
    .trend-icon.danger { background: #dc3545; }
    .trend-icon.info { background: #17a2b8; }

    .trend-info h4 {
      margin: 0 0 5px 0;
      color: var(--primary-color);
      font-size: 1rem;
    }

    .trend-info p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-data i {
      font-size: 2rem;
      margin-bottom: 15px;
      color: var(--accent-color);
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .loading i {
      font-size: 3rem;
      margin-bottom: 20px;
      color: var(--accent-color);
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .chart-section {
        grid-template-columns: 1fr;
      }
      
      .trend-content {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
    }
  `]
})
export class EstadisticasComponent implements OnInit {
  estadisticasComentarios?: EstadisticasComentarios;
  estadisticasProductos?: EstadisticasProductos;
  loading = true;
  actualizando = false;

  constructor(
    private comentariosService: ComentariosService,
    private productosService: ProductosService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.loading = true;
    
    // Cargar estadísticas reales de las APIs
    this.cargarEstadisticasReales();
  }

  private cargarEstadisticasReales(): void {
    let comentarios: any[] = [];
    let productos: any[] = [];
    
    // Cargar comentarios y productos en paralelo
    this.comentariosService.getAllComentarios().subscribe({
      next: (comentariosData) => {
        comentarios = comentariosData;
        this.procesarEstadisticasComentarios(comentarios);
        
        // Si ya tenemos productos, procesar estadísticas completas
        if (productos.length > 0) {
          this.procesarProductosPopulares(productos, comentarios);
        }
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
        this.simularEstadisticasComentarios();
      }
    });

    this.productosService.getAllProductos().subscribe({
      next: (productosData) => {
        productos = productosData;
        this.procesarEstadisticasProductos(productos);
        
        // Si ya tenemos comentarios, procesar estadísticas completas
        if (comentarios.length > 0) {
          this.procesarProductosPopulares(productos, comentarios);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.simularEstadisticasProductos();
      }
    });

    this.loading = false;
  }

  private procesarEstadisticasComentarios(comentarios: any[]): void {
    const total = comentarios.length;
    
    // Calcular promedio de calificaciones
    const sumaRatings = comentarios.reduce((sum, comment) => sum + (comment.rating || 0), 0);
    const promedio = total > 0 ? sumaRatings / total : 0;

    // Contar comentarios por calificación
    const comentariosPorCalificacion: { [key: number]: number } = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    comentarios.forEach(comment => {
      const rating = Math.round(comment.rating || 0);
      if (rating >= 1 && rating <= 5) {
        comentariosPorCalificacion[rating]++;
      }
    });

    // Comentarios recientes (últimos 7 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    const comentariosRecientes = comentarios.filter(comment => {
      const fechaComentario = new Date(comment.created_at);
      return fechaComentario >= fechaLimite;
    }).length;

    this.estadisticasComentarios = {
      totalComentarios: total,
      promedioCalificacion: promedio,
      comentariosPorCalificacion,
      comentariosRecientes
    };
  }

  private procesarEstadisticasProductos(productos: any[]): void {
    const total = productos.length;
    
    // Calcular productos activos (asumimos que todos están activos si no hay campo)
    const activos = productos.filter(p => p.activo !== false).length;
    
    // Calcular productos sin stock (asumimos stock = 0 o undefined como sin stock)
    const sinStock = productos.filter(p => !p.stock || p.stock === 0).length;
    
    // Calcular promedio de precios
    const sumaPrecios = productos.reduce((sum, producto) => sum + (producto.price || 0), 0);
    const promedioPrecios = total > 0 ? sumaPrecios / total : 0;

    this.estadisticasProductos = {
      totalProductos: total,
      productosActivos: activos,
      productosSinStock: sinStock,
      ventasTotales: Math.floor(Math.random() * 10000) + 5000, // Simulado
      promedioPrecios,
      productosPopulares: [] // Se actualizará en procesarProductosPopulares
    };
  }

  private procesarProductosPopulares(productos: any[], comentarios: any[]): void {
    // Crear un mapa de comentarios por producto
    const comentariosPorProducto = new Map<number, any[]>();
    
    comentarios.forEach(comentario => {
      const productId = comentario.product_id;
      if (!comentariosPorProducto.has(productId)) {
        comentariosPorProducto.set(productId, []);
      }
      comentariosPorProducto.get(productId)!.push(comentario);
    });

    // Calcular estadísticas por producto
    const productosConEstadisticas = productos.map(producto => {
      const comentariosProducto = comentariosPorProducto.get(producto.id) || [];
      const totalComentarios = comentariosProducto.length;
      
      // Calcular calificación promedio
      const sumaRatings = comentariosProducto.reduce((sum, comment) => sum + (comment.rating || 0), 0);
      const promedioCalificacion = totalComentarios > 0 ? sumaRatings / totalComentarios : 0;

      return {
        nombre: producto.name || `Producto ${producto.id}`,
        comentarios: totalComentarios,
        calificacion: promedioCalificacion
      };
    });

    // Ordenar por número de comentarios (descendente) y tomar los top 3
    const productosPopulares = productosConEstadisticas
      .filter(p => p.comentarios > 0) // Solo productos con comentarios
      .sort((a, b) => b.comentarios - a.comentarios)
      .slice(0, 3);

    // Actualizar las estadísticas de productos
    if (this.estadisticasProductos) {
      this.estadisticasProductos.productosPopulares = productosPopulares;
    }
  }

  private simularEstadisticasComentarios(): void {
    this.estadisticasComentarios = {
      totalComentarios: 0,
      promedioCalificacion: 0,
      comentariosPorCalificacion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      comentariosRecientes: 0
    };
  }

  private simularEstadisticasProductos(): void {
    this.estadisticasProductos = {
      totalProductos: 0,
      productosActivos: 0,
      productosSinStock: 0,
      ventasTotales: 0,
      promedioPrecios: 0,
      productosPopulares: []
    };
  }

  actualizarEstadisticas(): void {
    this.actualizando = true;
    this.cargarEstadisticasReales();
    setTimeout(() => {
      this.actualizando = false;
      this.sweetAlert.success('Actualizado', 'Estadísticas actualizadas correctamente');
    }, 1500);
  }

  calcularPromedioComentariosPorProducto(): string {
    if (!this.estadisticasComentarios || !this.estadisticasProductos) return '0.0';
    
    const promedio = this.estadisticasComentarios.totalComentarios / this.estadisticasProductos.totalProductos;
    return promedio.toFixed(1);
  }

  getStarsArray(count: number): number[] {
    return Array(count).fill(0);
  }

  getCalificacionPorcentaje(rating: number): number {
    if (!this.estadisticasComentarios?.comentariosPorCalificacion) return 0;
    
    const total = Object.values(this.estadisticasComentarios.comentariosPorCalificacion)
      .reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 0;
    
    return (this.estadisticasComentarios.comentariosPorCalificacion[rating] || 0) / total * 100;
  }

  getCalificacionCount(rating: number): number {
    return this.estadisticasComentarios?.comentariosPorCalificacion[rating] || 0;
  }

  getTendenciaComentarios(): string {
    const recientes = this.estadisticasComentarios?.comentariosRecientes || 0;
    if (recientes > 15) return 'Alta actividad en comentarios recientes';
    if (recientes > 8) return 'Actividad moderada en comentarios';
    return 'Baja actividad en comentarios recientes';
  }

  getTendenciaStock(): string {
    const sinStock = this.estadisticasProductos?.productosSinStock || 0;
    if (sinStock > 5) return 'Varios productos sin stock';
    if (sinStock > 2) return 'Algunos productos requieren restock';
    return 'Inventario en buen estado';
  }

  getIconoTendenciaStock(): string {
    const sinStock = this.estadisticasProductos?.productosSinStock || 0;
    if (sinStock > 5) return 'danger';
    if (sinStock > 2) return 'warning';
    return 'success';
  }

  getIconoStock(): string {
    const sinStock = this.estadisticasProductos?.productosSinStock || 0;
    if (sinStock > 5) return 'fa-arrow-down';
    if (sinStock > 2) return 'fa-minus';
    return 'fa-arrow-up';
  }

  getSatisfaccionCliente(): string {
    const promedio = this.estadisticasComentarios?.promedioCalificacion || 0;
    if (promedio >= 4.5) return 'Excelente satisfacción del cliente';
    if (promedio >= 4.0) return 'Buena satisfacción del cliente';
    if (promedio >= 3.5) return 'Satisfacción moderada';
    return 'Requiere mejorar la satisfacción';
  }
}
