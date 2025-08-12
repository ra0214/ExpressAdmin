import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Comentario {
  id: number;
  comment: string; // Cambiado de 'contenido' a 'comment'
  rating: number;  // Cambiado de 'calificacion' a 'rating'
  created_at: string; // Cambiado de 'fecha_creacion' a 'created_at'
  product_id: number; // Cambiado de 'producto_id' a 'product_id'
  user_name?: string; // Cambiado de 'nombre_usuario' a 'user_name'
  nombre_producto?: string; // Este campo lo agregamos desde el frontend
}

export interface EstadisticasComentarios {
  totalComentarios: number;
  promedioCalificacion: number;
  comentariosPorCalificacion: {
    [key: number]: number;
  };
  comentariosRecientes: number;
}

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {
    console.log('🚀 ComentariosService iniciado con API URL:', this.apiUrl); // Debug temporal
  }

  // Método de prueba para verificar conectividad
  testConnection(): Observable<any> {
    const testUrl = `${this.apiUrl}/comments/`;
    console.log('🧪 Probando conexión a:', testUrl);
    
    return this.http.get<any>(testUrl).pipe(
      catchError((error) => {
        console.error('🚨 Error de conexión:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener todos los comentarios con información del producto
  getAllComentarios(): Observable<Comentario[]> {
    const url = `${this.apiUrl}/comments/`;
    console.log('🔍 Intentando conectar a:', url); // Debug temporal
    console.log('🔍 API URL base:', this.apiUrl); // Debug temporal
    
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('✅ Respuesta exitosa:', response); // Debug temporal
          // Intentar diferentes formatos de respuesta
          if (response.data) {
            return response.data;
          } else if (Array.isArray(response)) {
            return response;
          } else {
            return [];
          }
        }),
        catchError((error) => {
          console.error('❌ Error detallado:', error); // Debug temporal
          console.error('❌ Error status:', error.status); // Debug temporal
          console.error('❌ Error message:', error.message); // Debug temporal
          return this.handleError(error);
        })
      );
  }

  // Obtener comentarios por producto
  getComentariosByProducto(productoId: number): Observable<Comentario[]> {
    return this.http.get<any>(`${this.apiUrl}/comments/product/${productoId}`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  // Eliminar comentario
  eliminarComentario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener estadísticas de comentarios
  getEstadisticas(): Observable<EstadisticasComentarios> {
    return this.http.get<EstadisticasComentarios>(`${this.apiUrl}/comments/statistics`)
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
        case 0:
          errorMessage = 'No se puede conectar al servidor. Verifica que la API esté ejecutándose.';
          break;
        case 404:
          errorMessage = 'Endpoint no encontrado. Verifica la URL de la API.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || `Error de conexión (${error.status})`;
      }
    }
    
    return throwError(() => errorMessage);
  }
}
