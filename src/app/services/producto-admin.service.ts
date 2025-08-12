import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  Producto, 
  CreateProducto, 
  UpdateProducto, 
  FiltroProductos, 
  EstadisticasProductos 
} from '../models/producto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoAdminService {
  private apiUrl = `${environment.apiUrl}/admin/products`;

  constructor(private http: HttpClient) { }

  // Obtener todos los productos con filtros
  getProductos(filtros?: FiltroProductos): Observable<Producto[]> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.categoria) params = params.set('categoria', filtros.categoria);
      if (filtros.precioMin) params = params.set('precioMin', filtros.precioMin.toString());
      if (filtros.precioMax) params = params.set('precioMax', filtros.precioMax.toString());
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
      if (filtros.ordenPor) params = params.set('ordenPor', filtros.ordenPor);
      if (filtros.orden) params = params.set('orden', filtros.orden);
      if (filtros.limite) params = params.set('limite', filtros.limite.toString());
      if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
    }

    return this.http.get<Producto[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  // Obtener producto por ID
  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Crear nuevo producto
  createProducto(producto: CreateProducto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto)
      .pipe(catchError(this.handleError));
  }

  // Actualizar producto
  updateProducto(producto: UpdateProducto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${producto.id}`, producto)
      .pipe(catchError(this.handleError));
  }

  // Eliminar producto
  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Obtener estadísticas de productos
  getEstadisticas(): Observable<EstadisticasProductos> {
    return this.http.get<EstadisticasProductos>(`${this.apiUrl}/estadisticas`)
      .pipe(catchError(this.handleError));
  }

  // Subir imagen de producto
  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  // Obtener categorías disponibles
  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorias`)
      .pipe(catchError(this.handleError));
  }

  // Exportar productos a CSV
  exportarCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, { 
      responseType: 'blob' 
    }).pipe(catchError(this.handleError));
  }

  // Importar productos desde CSV
  importarCSV(file: File): Observable<{ importados: number; errores: string[] }> {
    const formData = new FormData();
    formData.append('csv', file);
    
    return this.http.post<{ importados: number; errores: string[] }>(
      `${this.apiUrl}/import/csv`, 
      formData
    ).pipe(catchError(this.handleError));
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 404:
          errorMessage = 'Producto no encontrado';
          break;
        case 409:
          errorMessage = 'El producto ya existe';
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
