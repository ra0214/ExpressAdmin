import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService, Producto } from '../services/productos.service';
import { SweetAlertService } from '../services/sweet-alert.service';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="productos-container">
      <div class="header">
        <h2><i class="fas fa-boxes"></i> Gestión de Productos</h2>
        <button class="btn-agregar" (click)="abrirModalCrear()">
          <i class="fas fa-plus"></i> Agregar Producto
        </button>
      </div>

      <div class="stats">
        <div class="stat-card">
          <i class="fas fa-box"></i>
          <div>
            <span class="number">{{ productos.length }}</span>
            <span class="label">Total Productos</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-check-circle"></i>
          <div>
            <span class="number">{{ productosActivos }}</span>
            <span class="label">Productos Activos</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-boxes"></i>
          <div>
            <span class="number">{{ totalProductos }}</span>
            <span class="label">Total Productos</span>
          </div>
        </div>
      </div>

      <div class="filters">
        <div class="search-group">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            [(ngModel)]="busqueda"
            (input)="aplicarFiltros()"
          >
          <i class="fas fa-search"></i>
        </div>
        <div class="filter-group">
          <select [(ngModel)]="filtroCategoria" (change)="aplicarFiltros()">
            <option value="">Todas las categorías</option>
            <option value="electronics">Electrónicos</option>
            <option value="clothing">Ropa</option>
            <option value="books">Libros</option>
            <option value="home">Hogar</option>
          </select>
        </div>
      </div>

      <div class="productos-grid" *ngIf="!loading">
        <div class="producto-card" *ngFor="let producto of productosFiltrados">
          <div class="producto-imagen">
            <img [src]="getImageUrl(producto.image_url)" 
                 [alt]="producto.name"
                 (error)="onImageError($event)">
            <div class="overlay">
              <button class="btn-editar" (click)="editarProducto(producto)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-eliminar" (click)="eliminarProducto(producto.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="producto-info">
            <h3>{{ producto.name }}</h3>
            <p class="descripcion">{{ producto.description }}</p>
            
            <div class="precio-categoria">
              <span class="precio">\${{ producto.price | number:'1.2-2' }}</span>
              <span class="categoria">
                <i class="fas fa-tag"></i>
                {{ producto.category }}
              </span>
            </div>
            
            <div class="estado" *ngIf="producto.activo !== undefined">
              <span class="badge" [class.activo]="producto.activo" [class.inactivo]="!producto.activo">
                {{ producto.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando productos...</p>
      </div>

      <div class="no-data" *ngIf="!loading && productosFiltrados.length === 0">
        <i class="fas fa-box-open"></i>
        <p>No se encontraron productos</p>
      </div>
    </div>

    <!-- Modal para crear/editar producto -->
    <div class="modal-overlay" *ngIf="mostrarModal" (click)="cerrarModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editandoProducto ? 'Editar' : 'Crear' }} Producto</h3>
          <button class="btn-cerrar" (click)="cerrarModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form (ngSubmit)="guardarProducto()" #productoForm="ngForm" class="modal-form">
          <div class="form-group">
            <label for="name">Nombre *</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              [(ngModel)]="productoFormData.name" 
              required
              placeholder="Nombre del producto"
            >
          </div>
          
          <div class="form-group">
            <label for="description">Descripción</label>
            <textarea 
              id="description" 
              name="description"
              [(ngModel)]="productoFormData.description"
              rows="3"
              placeholder="Descripción del producto"
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="price">Precio *</label>
              <input 
                type="number" 
                id="price" 
                name="price"
                [(ngModel)]="productoFormData.price" 
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              >
            </div>
            
            <div class="form-group">
              <label for="category">Categoría *</label>
              <input 
                type="text" 
                id="category" 
                name="category"
                [(ngModel)]="productoFormData.category" 
                required
                placeholder="Categoría del producto"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="image_url">URL de Imagen</label>
            <input 
              type="url" 
              id="image_url" 
              name="image_url"
              [(ngModel)]="productoFormData.image_url"
              placeholder="https://ejemplo.com/imagen.jpg"
            >
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancelar" (click)="cerrarModal()">
              Cancelar
            </button>
            <button type="submit" class="btn-guardar" [disabled]="!productoForm.valid || guardando">
              <i class="fas fa-spinner fa-spin" *ngIf="guardando"></i>
              {{ guardando ? 'Guardando...' : (editandoProducto ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .productos-container {
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

    .btn-agregar {
      background: var(--accent-color);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s ease;
    }

    .btn-agregar:hover {
      background: #27ae60;
    }

    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
      min-width: 200px;
    }

    .stat-card i {
      font-size: 2rem;
      color: var(--accent-color);
    }

    .stat-card .number {
      display: block;
      font-size: 1.8rem;
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
    }

    .search-group {
      position: relative;
      flex-grow: 1;
      max-width: 400px;
    }

    .search-group input {
      width: 100%;
      padding: 12px 45px 12px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 25px;
      font-size: 1rem;
    }

    .search-group i {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .filter-group select {
      padding: 10px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
    }

    .productos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 25px;
    }

    .producto-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .producto-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 25px rgba(0,0,0,0.15);
    }

    .producto-imagen {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .producto-imagen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .producto-card:hover .overlay {
      opacity: 1;
    }

    .btn-editar, .btn-eliminar {
      padding: 10px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.1rem;
      transition: transform 0.3s ease;
    }

    .btn-editar {
      background: #007bff;
      color: white;
    }

    .btn-eliminar {
      background: #dc3545;
      color: white;
    }

    .btn-editar:hover, .btn-eliminar:hover {
      transform: scale(1.1);
    }

    .producto-info {
      padding: 20px;
    }

    .producto-info h3 {
      margin: 0 0 10px 0;
      color: var(--primary-color);
      font-size: 1.2rem;
    }

    .descripcion {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 15px 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .precio-categoria {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .precio {
      font-size: 1.3rem;
      font-weight: bold;
      color: var(--accent-color);
    }

    .categoria {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.9rem;
      color: #666;
      padding: 4px 8px;
      background: #f8f9fa;
      border-radius: 12px;
      text-transform: capitalize;
    }

    .estado {
      text-align: center;
    }

    .badge {
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .badge.activo {
      background: #d4edda;
      color: #155724;
    }

    .badge.inactivo {
      background: #f8d7da;
      color: #721c24;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-header h3 {
      margin: 0;
      color: var(--primary-color);
    }

    .btn-cerrar {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 5px;
    }

    .modal-form {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-color);
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 10px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      border-color: var(--accent-color);
      outline: none;
    }

    .checkbox-label {
      display: flex !important;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto !important;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .btn-cancelar {
      background: #6c757d;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-guardar {
      background: var(--accent-color);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-guardar:disabled {
      background: #ccc;
      cursor: not-allowed;
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

    @media (max-width: 768px) {
      .productos-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      
      .stats {
        flex-direction: column;
      }
      
      .filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-group {
        max-width: none;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  loading = true;
  busqueda = '';
  filtroCategoria = '';
  
  // Modal
  mostrarModal = false;
  editandoProducto = false;
  guardando = false;
  productoFormData: any = this.resetForm();

  // Estadísticas
  get productosActivos(): number {
    return this.productos.filter(p => p.activo !== false).length;
  }

  get totalProductos(): number {
    return this.productos.length;
  }

  constructor(
    private productosService: ProductosService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.productosService.getAllProductos().subscribe({
      next: (productos) => {
        this.productos = productos || [];
        this.productosFiltrados = [...this.productos];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar productos:', error);
        this.sweetAlert.error('Error', 'No se pudieron cargar los productos');
      }
    });
  }

  aplicarFiltros(): void {
    this.productosFiltrados = this.productos.filter(producto => {
      const coincideBusqueda = !this.busqueda || 
        producto.name.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        producto.description.toLowerCase().includes(this.busqueda.toLowerCase());
      
      const coincideCategoria = !this.filtroCategoria || 
        producto.category.toLowerCase() === this.filtroCategoria.toLowerCase();

      return coincideBusqueda && coincideCategoria;
    });
  }

  abrirModalCrear(): void {
    this.editandoProducto = false;
    this.productoFormData = this.resetForm();
    this.mostrarModal = true;
  }

  editarProducto(producto: Producto): void {
    this.editandoProducto = true;
    this.productoFormData = { ...producto };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.productoFormData = this.resetForm();
  }

  resetForm(): any {
    return {
      name: '',
      description: '',
      price: 0,
      category: '',
      image_url: ''
    };
  }

  guardarProducto(): void {
    this.guardando = true;
    
    if (this.editandoProducto) {
      this.productosService.actualizarProducto(this.productoFormData.id, this.productoFormData).subscribe({
        next: (producto) => {
          const index = this.productos.findIndex(p => p.id === producto.id);
          if (index !== -1) {
            this.productos[index] = producto;
            this.aplicarFiltros();
          }
          this.guardando = false;
          this.cerrarModal();
          this.sweetAlert.success('Actualizado', 'Producto actualizado correctamente');
        },
        error: (error) => {
          this.guardando = false;
          this.sweetAlert.error('Error', 'No se pudo actualizar el producto');
          console.error('Error al actualizar producto:', error);
        }
      });
    } else {
      this.productosService.crearProducto(this.productoFormData).subscribe({
        next: (producto) => {
          this.productos.push(producto);
          this.aplicarFiltros();
          this.guardando = false;
          this.cerrarModal();
          this.sweetAlert.success('Creado', 'Producto creado correctamente');
        },
        error: (error) => {
          this.guardando = false;
          this.sweetAlert.error('Error', 'No se pudo crear el producto');
          console.error('Error al crear producto:', error);
        }
      });
    }
  }

  eliminarProducto(id: number): void {
    this.sweetAlert.confirm(
      '¿Eliminar producto?',
      'Esta acción eliminará el producto y todos sus comentarios asociados. No se puede deshacer.'
    ).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading mientras se elimina
        this.sweetAlert.loading('Eliminando producto y comentarios...');
        
        this.productosService.eliminarProducto(id).subscribe({
          next: () => {
            this.productos = this.productos.filter(p => p.id !== id);
            this.aplicarFiltros();
            this.sweetAlert.close();
            this.sweetAlert.success('Eliminado', 'Producto y sus comentarios eliminados correctamente');
          },
          error: (error) => {
            this.sweetAlert.close();
            console.error('Error al eliminar producto:', error);
            
            // Mostrar error específico dependiendo del tipo
            if (error.includes('comentarios asociados')) {
              this.sweetAlert.error(
                'No se puede eliminar', 
                'El producto tiene comentarios asociados. Primero elimina los comentarios desde la sección de gestión de comentarios.'
              );
            } else {
              this.sweetAlert.error('Error', `No se pudo eliminar el producto: ${error}`);
            }
          }
        });
      }
    });
  }

  getImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
      return this.getPlaceholderImage();
    }
    
    // Si ya es una URL completa, devolverla tal como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Si es una ruta relativa, construir la URL completa
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    
    // Si no tiene protocolo ni slash, asumir que es una ruta desde la raíz
    return `http://localhost:8080/${imageUrl}`;
  }

  getPlaceholderImage(): string {
    // Usar un placeholder desde una URL externa confiable
    return 'https://via.placeholder.com/300x200/f0f0f0/666666?text=Producto';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.getPlaceholderImage()) {
      target.src = this.getPlaceholderImage();
    }
  }
}
