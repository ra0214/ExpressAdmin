import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Producto {
  id: number;
  name: string;        // Cambiado de 'nombre' a 'name'
  description: string; // Cambiado de 'descripcion' a 'description'
  price: number;       // Cambiado de 'precio' a 'price'
  category: string;    // Nuevo campo
  image_url?: string;  // Cambiado de 'imagen' a 'image_url'
  stock?: number;      // Campo opcional (no está en backend)
  fecha_creacion?: string; // Campo opcional (no está en backend)
  activo?: boolean;    // Campo opcional (no está en backend)
}

export interface EstadisticasProductos {
  totalProductos: number;
  productosActivos: number;
  productosSinStock: number;
  ventasTotales: number;
  promedioPrecios: number;
  productosPopulares: {
    nombre: string;
    comentarios: number;
    calificacion: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  // Obtener todos los productos
  getAllProductos(): Observable<Producto[]> {
    return this.http.get<any>(`${this.apiUrl}/products`)
      .pipe(
        map(response => {
          // La API devuelve {data: [...]} o directamente el array
          const data = response.data || response;
          return Array.isArray(data) ? data : [];
        }),
        catchError(this.handleError)
      );
  }

  // Obtener producto por ID
  getProducto(id: number): Observable<Producto> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  // Crear producto
  crearProducto(producto: Omit<Producto, 'id'>): Observable<Producto> {
    return this.http.post<any>(`${this.apiUrl}/products`, producto)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  // Actualizar producto
  actualizarProducto(id: number, producto: Partial<Producto>): Observable<Producto> {
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, producto)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  // Eliminar producto
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  // Obtener estadísticas de productos
  getEstadisticas(): Observable<EstadisticasProductos> {
    return this.http.get<EstadisticasProductos>(`${this.apiUrl}/products/statistics`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Solicitud inválida';
          break;
        case 404:
          errorMessage = 'Producto no encontrado';
          break;
        case 409:
          errorMessage = 'No se puede eliminar el producto. Tiene comentarios asociados.';
          break;
        case 500:
          errorMessage = error.error?.message || 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || 'Error de conexión';
      }
    }
    
    console.error('Error en ProductosService:', error);
    return throwError(() => errorMessage);
  }
}
