import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CategoriasService, Categoria, CreateCategoriaRequest, UpdateCategoriaRequest } from '../services/categorias.service';
import { SweetAlertService } from '../services/sweet-alert.service';
import { WebSocketService } from '../services/websocket.service';
import { HeaderComponent } from './header.component';
import { DriveLinkService } from '../services/drive-link.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="categorias-container">
      <div class="header">
        <h2><i class="fas fa-tags"></i> Gestión de Categorías</h2>
        <button class="btn-agregar" (click)="abrirModalCrear()">
          <i class="fas fa-plus"></i> Agregar Categoría
        </button>
      </div>

      <div class="stats">
        <div class="stat-card">
          <i class="fas fa-tags"></i>
          <div>
            <span class="number">{{ categorias.length || 0 }}</span>
            <span class="label">Total Categorías</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-check-circle"></i>
          <div>
            <span class="number">{{ categoriasActivas }}</span>
            <span class="label">Categorías Activas</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-eye-slash"></i>
          <div>
            <span class="number">{{ categoriasInactivas }}</span>
            <span class="label">Categorías Inactivas</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-wifi" *ngIf="wsConnected"></i>
          <i class="fas fa-exclamation-triangle" *ngIf="!wsConnected"></i>
          <div>
            <span class="number">{{ wsConnected ? 'ON' : 'OFF' }}</span>
            <span class="label">Tiempo Real</span>
          </div>
        </div>
      </div>

      <div class="filters">
        <div class="search-group">
          <input 
            type="text" 
            placeholder="Buscar categorías..." 
            [(ngModel)]="busqueda"
            (input)="filtrarCategorias()"
            class="search-input"
          >
          <i class="fas fa-search search-icon"></i>
        </div>
        
        <div class="filter-group">
          <select [(ngModel)]="filtroEstado" (change)="filtrarCategorias()" class="filter-select">
            <option value="">Todas las categorías</option>
            <option value="activas">Solo activas</option>
            <option value="inactivas">Solo inactivas</option>
          </select>
        </div>

        <button class="btn-refresh" (click)="cargarCategorias()" [disabled]="loading">
          <i class="fas fa-sync" [class.fa-spin]="loading"></i>
          Actualizar
        </button>
      </div>

      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Cargando categorías...</span>
      </div>

      <div class="categorias-grid" *ngIf="!loading && categoriasFiltradas.length > 0">
        <div 
          class="categoria-card" 
          *ngFor="let categoria of categoriasFiltradas; trackBy: trackByCategoria"
          [class.inactiva]="!categoria.is_active"
        >
          <div class="categoria-imagen">
            <img 
              [src]="getImageUrl(categoria.image_url)" 
              [alt]="categoria.name"
              (error)="onImageError($event)"
              loading="lazy"
            >
            <div class="estado-badge" [class.activo]="categoria.is_active" [class.inactivo]="!categoria.is_active">
              {{ categoria.is_active ? 'Activa' : 'Inactiva' }}
            </div>
          </div>
          
          <div class="categoria-info">
            <h3>{{ categoria.name }}</h3>
            <p class="descripcion">{{ categoria.description || 'Sin descripción' }}</p>
            <div class="categoria-meta">
              <span class="fecha">
                <i class="fas fa-calendar"></i>
                {{ formatearFecha(categoria.created_at) }}
              </span>
              <span class="id">ID: {{ categoria.id }}</span>
            </div>
          </div>
          
          <div class="categoria-actions">
            <button 
              class="btn-action edit" 
              (click)="editarCategoria(categoria)"
              title="Editar categoría"
            >
              <i class="fas fa-edit"></i>
            </button>
            
            <button 
              class="btn-action toggle" 
              (click)="toggleEstadoCategoria(categoria)"
              [title]="categoria.is_active ? 'Desactivar categoría' : 'Activar categoría'"
              [class.activate]="!categoria.is_active"
              [class.deactivate]="categoria.is_active"
            >
              <i class="fas" [class.fa-eye-slash]="categoria.is_active" [class.fa-eye]="!categoria.is_active"></i>
            </button>
            
            <button 
              class="btn-action delete" 
              (click)="eliminarCategoria(categoria)"
              title="Eliminar categoría"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && categoriasFiltradas.length === 0">
        <i class="fas fa-tags"></i>
        <h3>{{ categorias.length === 0 ? 'No hay categorías' : 'No se encontraron categorías' }}</h3>
        <p>
          {{ categorias.length === 0 
            ? 'Comienza agregando tu primera categoría' 
            : 'Intenta ajustar los filtros de búsqueda' 
          }}
        </p>
        <button class="btn-primary" (click)="abrirModalCrear()" *ngIf="categorias.length === 0">
          <i class="fas fa-plus"></i>
          Crear Primera Categoría
        </button>
      </div>
    </div>

    <!-- Modal para crear/editar categoría -->
    <div class="modal-overlay" *ngIf="mostrarModal" (click)="cerrarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas" [class.fa-plus]="!editandoCategoria" [class.fa-edit]="editandoCategoria"></i>
            {{ editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría' }}
          </h3>
          <button type="button" class="btn-close" (click)="cerrarModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form #categoriaForm="ngForm" (ngSubmit)="guardarCategoria()">
          <div class="modal-body">
            <style>
              .image-url-inputs {
                display: flex;
                gap: 10px;
              }
              
              .image-url-inputs input {
                flex-grow: 1;
              }
              
              .btn-toggle-drive {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
              }
              
              .btn-toggle-drive:hover {
                background: #3367d6;
              }
              
              .drive-picker-wrapper {
                margin-top: 16px;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                padding: 16px;
                background-color: #f8f9fa;
              }
              
              .drive-help-content {
                color: #444;
              }
              
              .drive-help-content h4 {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
                margin-top: 0;
                margin-bottom: 12px;
                color: #4285f4;
              }
              
              .drive-help-content p {
                margin-bottom: 10px;
                font-size: 14px;
              }
              
              .drive-help-content ol {
                margin-bottom: 16px;
                padding-left: 20px;
              }
              
              .drive-help-content ol li {
                margin-bottom: 8px;
                font-size: 14px;
              }
              
              .btn-convertir-url {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 10px;
                padding: 8px 16px;
                background-color: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              }
              
              .btn-convertir-url:hover {
                background-color: #3367d6;
              }
              
              .btn-convertir-url:disabled {
                background-color: #cccccc;
                cursor: not-allowed;
              }
            </style>
            <div class="form-group">
              <label for="name">Nombre *</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                [(ngModel)]="categoriaFormData.name" 
                required
                placeholder="Nombre de la categoría"
                class="form-input"
                maxlength="100"
              >
              <small class="help-text">Máximo 100 caracteres</small>
            </div>
            
            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea 
                id="description" 
                name="description"
                [(ngModel)]="categoriaFormData.description"
                rows="4"
                placeholder="Descripción de la categoría (opcional)"
                class="form-textarea"
                maxlength="500"
              ></textarea>
              <small class="help-text">Máximo 500 caracteres</small>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [(ngModel)]="categoriaFormData.is_active"
                  name="is_active"
                  class="form-checkbox"
                >
                <span class="checkmark"></span>
                <span class="checkbox-text">Categoría activa</span>
              </label>
              <small class="help-text">Las categorías inactivas no aparecerán en la tienda</small>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancelar" (click)="cerrarModal()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-guardar" 
              [disabled]="!categoriaForm.valid || guardando"
            >
              <i class="fas fa-spinner fa-spin" *ngIf="guardando"></i>
              <i class="fas" [class.fa-plus]="!editandoCategoria && !guardando" [class.fa-save]="editandoCategoria && !guardando" *ngIf="!guardando"></i>
              {{ guardando ? 'Guardando...' : (editandoCategoria ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  categorias: Categoria[] = [];
  categoriasFiltradas: Categoria[] = [];
  loading = true;
  wsConnected = false;
  busqueda = '';
  filtroEstado = '';
  
  // Modal
  mostrarModal = false;
  editandoCategoria = false;
  guardando = false;
  categoriaFormData: CreateCategoriaRequest = this.resetForm();
  
  // Google Drive
  mostrarDrivePicker = false;
  driveUrl = '';

  constructor(
    private categoriasService: CategoriasService,
    private sweetAlert: SweetAlertService,
    private webSocketService: WebSocketService,
    private driveLinkService: DriveLinkService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.cargarCategorias();
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

      // Escuchar actualizaciones de categorías
      this.webSocketService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe(message => {
          if (message.type.includes('category')) {
            this.cargarCategorias();
          }
        });
    }
  }

  // Estadísticas calculadas
  get categoriasActivas(): number {
    return this.categorias?.filter(c => c.is_active)?.length || 0;
  }

  get categoriasInactivas(): number {
    return this.categorias?.filter(c => !c.is_active)?.length || 0;
  }

  cargarCategorias(): void {
    this.loading = true;
    this.categoriasService.getCategorias().subscribe({
      next: (response) => {
        this.categorias = response?.data || [];
        this.filtrarCategorias();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.categorias = [];
        this.categoriasFiltradas = [];
        this.loading = false;
        this.sweetAlert.error('Error', 'No se pudieron cargar las categorías');
      }
    });
  }

  filtrarCategorias(): void {
    if (!this.categorias || !Array.isArray(this.categorias)) {
      this.categoriasFiltradas = [];
      return;
    }

    let categoriasFiltradas = [...this.categorias];

    // Filtrar por búsqueda
    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase().trim();
      categoriasFiltradas = categoriasFiltradas.filter(categoria =>
        categoria.name.toLowerCase().includes(termino) ||
        categoria.description?.toLowerCase().includes(termino)
      );
    }

    // Filtrar por estado
    if (this.filtroEstado === 'activas') {
      categoriasFiltradas = categoriasFiltradas.filter(c => c.is_active);
    } else if (this.filtroEstado === 'inactivas') {
      categoriasFiltradas = categoriasFiltradas.filter(c => !c.is_active);
    }

    this.categoriasFiltradas = categoriasFiltradas;
  }

  // Modal methods
  abrirModalCrear(): void {
    this.editandoCategoria = false;
    this.mostrarModal = true;
    this.categoriaFormData = this.resetForm();
  }

  editarCategoria(categoria: Categoria): void {
    this.editandoCategoria = true;
    this.mostrarModal = true;
    this.categoriaFormData = {
      name: categoria.name,
      description: categoria.description,
      image_url: categoria.image_url,
      is_active: categoria.is_active
    };
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.editandoCategoria = false;
    this.categoriaFormData = this.resetForm();
  }

  guardarCategoria(): void {
    if (!this.categoriaFormData.name.trim()) {
      this.sweetAlert.warning('Campo requerido', 'El nombre de la categoría es obligatorio');
      return;
    }

    this.guardando = true;

    // Debug: Imprimir los datos que se van a enviar
    console.log('Datos a enviar:', this.categoriaFormData);

    const operacion = this.editandoCategoria 
      ? this.categoriasService.actualizarCategoria(this.getCategoriaEditandoId(), this.categoriaFormData)
      : this.categoriasService.crearCategoria(this.categoriaFormData);

    operacion.subscribe({
      next: (response) => {
        this.guardando = false;
        const mensaje = this.editandoCategoria ? 'actualizada' : 'creada';
        this.sweetAlert.success('¡Éxito!', `Categoría ${mensaje} correctamente`);
        this.cerrarModal();
        this.cargarCategorias();
      },
      error: (error) => {
        this.guardando = false;
        console.error('Error al guardar categoría:', error);
        console.error('Datos enviados:', this.categoriaFormData);
        console.error('Respuesta del servidor:', error.error);
        const mensaje = this.editandoCategoria ? 'actualizar' : 'crear';
        this.sweetAlert.error('Error', `No se pudo ${mensaje} la categoría`);
      }
    });
  }

  toggleEstadoCategoria(categoria: Categoria): void {
    const nuevoEstado = !categoria.is_active;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    this.sweetAlert.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} categoría?`,
      `¿Estás seguro de que quieres ${accion} la categoría "${categoria.name}"?`
    ).then((result) => {
      if (result.isConfirmed) {
        const updateData: UpdateCategoriaRequest = { is_active: nuevoEstado };
        
        this.categoriasService.actualizarCategoria(categoria.id, updateData).subscribe({
          next: () => {
            this.sweetAlert.success('¡Éxito!', `Categoría ${accion === 'activar' ? 'activada' : 'desactivada'} correctamente`);
            this.cargarCategorias();
          },
          error: (error) => {
            console.error(`Error al ${accion} categoría:`, error);
            this.sweetAlert.error('Error', `No se pudo ${accion} la categoría`);
          }
        });
      }
    });
  }

  eliminarCategoria(categoria: Categoria): void {
    this.sweetAlert.confirm(
      '¿Eliminar categoría?',
      `¿Estás seguro de que quieres eliminar la categoría "${categoria.name}"? Esta acción no se puede deshacer.`
    ).then((result) => {
      if (result.isConfirmed) {
        this.categoriasService.eliminarCategoria(categoria.id).subscribe({
          next: () => {
            this.sweetAlert.success('¡Eliminada!', 'La categoría ha sido eliminada correctamente');
            this.cargarCategorias();
          },
          error: (error) => {
            console.error('Error al eliminar categoría:', error);
            this.sweetAlert.error('Error', 'No se pudo eliminar la categoría');
          }
        });
      }
    });
  }

  // Utility methods
  private resetForm(): CreateCategoriaRequest {
    return {
      name: '',
      description: '',
      image_url: '',
      is_active: true
    };
  }

  private getCategoriaEditandoId(): number {
    // Encontrar la categoría que se está editando por nombre
    const categoria = this.categorias.find(c => c.name === this.categoriaFormData.name);
    return categoria ? categoria.id : 0;
  }

  trackByCategoria(index: number, categoria: Categoria): number {
    return categoria.id;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
      return this.getPlaceholderImage();
    }
    
    // Convertir enlaces de Google Drive si es necesario
    if (imageUrl && this.driveLinkService.isDriveLink(imageUrl)) {
      return this.driveLinkService.convertDriveLink(imageUrl);
    }
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    
    return `http://localhost:8080/${imageUrl}`;
  }

  getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" font-family="Arial,sans-serif" font-size="14" fill="%23666666" text-anchor="middle" dy="0.3em"%3ECategoría%3C/text%3E%3C/svg%3E';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.getPlaceholderImage()) {
      target.src = this.getPlaceholderImage();
    }
  }

  onImageLoad(): void {
    // Método para manejar la carga exitosa de imágenes si es necesario
  }

  // Métodos para Google Drive
  toggleDrivePicker(): void {
    this.mostrarDrivePicker = !this.mostrarDrivePicker;
    // Resetear la URL de Drive al alternar la visibilidad
    if (this.mostrarDrivePicker) {
      this.driveUrl = '';
    }
  }

  convertirUrlDrive(): void {
    if (!this.driveUrl) {
      this.sweetAlert.warning('URL Requerida', 'Por favor ingresa la URL de Google Drive');
      return;
    }

    try {
      // Intentar convertir la URL usando nuestro servicio
      if (this.driveLinkService.isDriveLink(this.driveUrl)) {
        const viewableUrl = this.driveLinkService.convertDriveLink(this.driveUrl);
        this.categoriaFormData.image_url = viewableUrl;
        this.driveUrl = '';
        this.sweetAlert.success('¡Éxito!', 'URL de Google Drive convertida correctamente');
      } else {
        this.sweetAlert.warning('URL Inválida', 'La URL no parece ser de Google Drive');
      }
    } catch (error) {
      console.error('Error al convertir URL de Drive:', error);
      this.sweetAlert.error('Error', 'No se pudo convertir la URL de Google Drive');
    }
  }
}
