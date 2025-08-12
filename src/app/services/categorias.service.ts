import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoriaRequest {
  name: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface UpdateCategoriaRequest {
  name?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080/api/v1'}/categories`;

  constructor(private http: HttpClient) {}

  // Obtener todas las categorías
  getCategorias(): Observable<{message: string, data: Categoria[]}> {
    return this.http.get<{message: string, data: Categoria[]}>(`${this.apiUrl}`);
  }

  // Obtener solo categorías activas
  getCategoriasActivas(): Observable<{message: string, data: Categoria[]}> {
    return this.http.get<{message: string, data: Categoria[]}>(`${this.apiUrl}/active`);
  }

  // Obtener categoría por ID
  getCategoriaById(id: number): Observable<{message: string, data: Categoria}> {
    return this.http.get<{message: string, data: Categoria}>(`${this.apiUrl}/${id}`);
  }

  // Crear nueva categoría
  crearCategoria(categoria: CreateCategoriaRequest): Observable<{message: string, data: Categoria}> {
    return this.http.post<{message: string, data: Categoria}>(`${this.apiUrl}`, categoria);
  }

  // Actualizar categoría
  actualizarCategoria(id: number, categoria: UpdateCategoriaRequest): Observable<{message: string, data: Categoria}> {
    return this.http.put<{message: string, data: Categoria}>(`${this.apiUrl}/${id}`, categoria);
  }

  // Eliminar categoría (soft delete)
  eliminarCategoria(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${id}`);
  }
}
