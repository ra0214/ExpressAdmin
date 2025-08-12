import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderComponent } from './header.component';
import { SweetAlertService } from '../services/sweet-alert.service';
import { UsuariosService, Usuario, CreateUsuarioRequest, UpdateUsuarioRequest } from '../services/usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  template: `
    <app-header></app-header>
    <div class="usuarios-container">
      <div class="header">
        <h2><i class="fas fa-users"></i> Gestión de Usuarios</h2>
        <div class="header-actions">
          <button class="btn-nuevo" (click)="mostrarFormularioCrear()">
            <i class="fas fa-plus"></i> Nuevo Usuario
          </button>
          <button class="btn-actualizar" (click)="cargarUsuarios()">
            <i class="fas fa-sync-alt" [class.fa-spin]="cargando"></i>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="cargando" class="loading-container">
        <div class="spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Cargando usuarios...</p>
      </div>

      <!-- Lista de Usuarios -->
      <div *ngIf="!cargando" class="usuarios-grid">
        <div class="usuario-card" *ngFor="let usuario of usuarios; trackBy: trackByUserId">
          <div class="usuario-info">
            <div class="usuario-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="usuario-datos">
              <h4>{{ usuario.username }}</h4>
              <p class="email">{{ usuario.email }}</p>
              <p class="fecha">Registrado: {{ formatDate(usuario.created_at) }}</p>
            </div>
          </div>
          
          <div class="usuario-acciones">
            <div class="estado-container">
              <span class="estado-label">Estado:</span>
              <span class="estado-badge" [class.activo]="usuario.estado" [class.inactivo]="!usuario.estado">
                {{ usuario.estado ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            
            <div class="acciones-botones">
              <button class="btn-editar" (click)="editarUsuario(usuario)" [disabled]="procesando">
                <i class="fas fa-edit"></i> Editar
              </button>
              
              <button 
                class="btn-toggle" 
                [class.btn-activar]="!usuario.estado"
                [class.btn-desactivar]="usuario.estado"
                (click)="toggleUserStatus(usuario)"
                [disabled]="procesando">
                <i class="fas" [class.fa-check]="!usuario.estado" [class.fa-ban]="usuario.estado"></i>
                {{ usuario.estado ? 'Desactivar' : 'Activar' }}
              </button>
              
              <button class="btn-eliminar" (click)="eliminarUsuario(usuario)" [disabled]="procesando">
                <i class="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="usuarios.length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No hay usuarios registrados</h3>
          <p>Cuando se registren usuarios aparecerán aquí</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !cargando" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar usuarios</h3>
        <p>{{ error }}</p>
        <button class="btn-reintentar" (click)="cargarUsuarios()">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>

      <!-- Modal para crear/editar usuario -->
      <div class="modal-overlay" *ngIf="mostrarModal" (click)="cerrarModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>
              <i class="fas" [class.fa-plus]="!modoEdicion" [class.fa-edit]="modoEdicion"></i>
              {{modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}}
            </h2>
            <button class="close-btn" (click)="cerrarModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form (ngSubmit)="guardarUsuario()" #formulario="ngForm">
            <div class="modal-body">
              <div class="form-group">
                <label for="username">Nombre de usuario:</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username"
                  [(ngModel)]="usuarioForm.username" 
                  required 
                  #username="ngModel"
                  class="form-control"
                  [class.is-invalid]="username.invalid && username.touched"
                  placeholder="Ingrese el nombre de usuario">
                <div class="invalid-feedback" *ngIf="username.invalid && username.touched">
                  El nombre de usuario es requerido
                </div>
              </div>

              <div class="form-group">
                <label for="email">Email:</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  [(ngModel)]="usuarioForm.email" 
                  required 
                  email
                  #email="ngModel"
                  class="form-control"
                  [class.is-invalid]="email.invalid && email.touched"
                  placeholder="usuario@ejemplo.com">
                <div class="invalid-feedback" *ngIf="email.invalid && email.touched">
                  <span *ngIf="email.errors?.['required']">El email es requerido</span>
                  <span *ngIf="email.errors?.['email']">Debe ser un email válido</span>
                </div>
              </div>

              <div class="form-group">
                <label for="password">{{modoEdicion ? 'Nueva Contraseña (opcional):' : 'Contraseña:'}}</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  [(ngModel)]="usuarioForm.password" 
                  [required]="!modoEdicion"
                  #password="ngModel"
                  class="form-control"
                  [class.is-invalid]="password.invalid && password.touched"
                  placeholder="{{modoEdicion ? 'Dejar vacío para mantener actual' : 'Contraseña segura'}}">
                <div class="invalid-feedback" *ngIf="password.invalid && password.touched && !modoEdicion">
                  La contraseña es requerida
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarModal()">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="formulario.invalid || guardando">
                <i class="fas" [class.fa-spinner]="guardando" [class.fa-spin]="guardando" 
                   [class.fa-save]="!guardando"></i>
                {{guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear')}}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .usuarios-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header h2 {
      color: #333;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .btn-nuevo {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .btn-nuevo:hover {
      background: #218838;
      transform: translateY(-2px);
    }

    .btn-actualizar {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .btn-actualizar:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .loading-container, .error-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .loading-container .spinner {
      font-size: 2rem;
      color: #007bff;
      margin-bottom: 20px;
    }

    .usuarios-grid {
      display: grid;
      gap: 20px;
    }

    .usuario-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
    }

    .usuario-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .usuario-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .usuario-avatar {
      width: 50px;
      height: 50px;
      background: linear-gradient(45deg, #007bff, #0056b3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }

    .usuario-datos h4 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .usuario-datos .email {
      margin: 0 0 5px 0;
      color: #666;
      font-size: 0.9rem;
    }

    .usuario-datos .fecha {
      margin: 0;
      color: #999;
      font-size: 0.8rem;
    }

    .usuario-acciones {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .estado-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .estado-label {
      font-size: 0.8rem;
      color: #666;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .estado-badge.activo {
      background: #d4edda;
      color: #155724;
    }

    .estado-badge.inactivo {
      background: #f8d7da;
      color: #721c24;
    }

    .acciones-botones {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-editar, .btn-toggle, .btn-eliminar {
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s ease;
    }

    .btn-editar {
      background: #17a2b8;
      color: white;
    }

    .btn-editar:hover:not(:disabled) {
      background: #138496;
    }

    .btn-toggle:disabled, .btn-editar:disabled, .btn-eliminar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-activar {
      background: #28a745;
      color: white;
    }

    .btn-activar:hover:not(:disabled) {
      background: #218838;
    }

    .btn-desactivar {
      background: #ffc107;
      color: #212529;
    }

    .btn-desactivar:hover:not(:disabled) {
      background: #e0a800;
    }

    .btn-eliminar {
      background: #dc3545;
      color: white;
    }

    .btn-eliminar:hover:not(:disabled) {
      background: #c82333;
    }

    .error-state i, .empty-state i {
      font-size: 3rem;
      color: #dc3545;
      margin-bottom: 20px;
    }

    .empty-state i {
      color: #6c757d;
    }

    .btn-reintentar {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 15px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 10px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 10px 10px 0 0;
    }

    .modal-header h2 {
      margin: 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #6c757d;
      padding: 5px;
      border-radius: 50%;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      color: #dc3545;
      background: #f8f9fa;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: #f8f9fa;
      border-radius: 0 0 10px 10px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ced4da;
      border-radius: 5px;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

    .invalid-feedback {
      display: block;
      width: 100%;
      margin-top: 5px;
      font-size: 0.875rem;
      color: #dc3545;
    }

    /* Button Styles */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    @media (max-width: 768px) {
      .usuario-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .usuario-acciones {
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .acciones-botones {
        justify-content: center;
        width: 100%;
      }

      .header {
        flex-direction: column;
        gap: 15px;
      }

      .header-actions {
        justify-content: center;
      }
    }
  `]
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  cargando = false;
  procesando = false;
  guardando = false;
  error: string | null = null;
  mostrarModal = false;
  modoEdicion = false;
  usuarioEditando: Usuario | null = null;
  private destroy$ = new Subject<void>();

  usuarioForm: CreateUsuarioRequest & { id?: number } = {
    username: '',
    email: '',
    password: ''
  };

  constructor(
    private usuariosService: UsuariosService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.error = null;

    this.usuariosService.getUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios || [];
          this.cargando = false;
          console.log('✅ Usuarios cargados:', this.usuarios);
        },
        error: (error) => {
          console.error('❌ Error cargando usuarios:', error);
          this.error = 'Error al cargar los usuarios. Verifica la conexión con la API.';
          this.cargando = false;
          this.sweetAlert.error('Error', 'No se pudieron cargar los usuarios');
        }
      });
  }

  mostrarFormularioCrear() {
    this.modoEdicion = false;
    this.usuarioEditando = null;
    this.usuarioForm = {
      username: '',
      email: '',
      password: ''
    };
    this.mostrarModal = true;
  }

  editarUsuario(usuario: Usuario) {
    this.modoEdicion = true;
    this.usuarioEditando = usuario;
    this.usuarioForm = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      password: ''
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.usuarioEditando = null;
    this.guardando = false;
  }

  async guardarUsuario() {
    try {
      this.guardando = true;

      if (this.modoEdicion && this.usuarioEditando) {
        // Actualizar usuario existente
        const updateData: UpdateUsuarioRequest = {
          username: this.usuarioForm.username,
          email: this.usuarioForm.email
        };

        // Solo incluir password si se proporcionó uno nuevo
        if (this.usuarioForm.password && this.usuarioForm.password.trim() !== '') {
          updateData.password = this.usuarioForm.password;
        }

        await this.usuariosService.updateUsuario(this.usuarioEditando.id, updateData).toPromise();
        this.sweetAlert.success('Usuario actualizado', 'El usuario ha sido actualizado correctamente');
      } else {
        // Crear nuevo usuario
        const createData: CreateUsuarioRequest = {
          username: this.usuarioForm.username,
          email: this.usuarioForm.email,
          password: this.usuarioForm.password,
          estado: true
        };

        await this.usuariosService.createUsuario(createData).toPromise();
        this.sweetAlert.success('Usuario creado', 'El usuario ha sido creado correctamente');
      }

      this.cerrarModal();
      this.cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      this.sweetAlert.error('Error', 'No se pudo guardar el usuario');
    } finally {
      this.guardando = false;
    }
  }

  async eliminarUsuario(usuario: Usuario) {
    try {
      const confirmado = await this.sweetAlert.confirm(
        '¿Eliminar usuario?',
        `¿Estás seguro de que quieres eliminar a ${usuario.username}? Esta acción no se puede deshacer.`,
        'warning'
      );

      if (!confirmado) return;

      this.procesando = true;

      await this.usuariosService.deleteUsuario(usuario.id).toPromise();
      
      // Remover el usuario de la lista local
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      
      this.sweetAlert.success('Usuario eliminado', 'El usuario ha sido eliminado correctamente');
      this.procesando = false;
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      this.sweetAlert.error('Error', 'No se pudo eliminar el usuario');
      this.procesando = false;
    }
  }

  async toggleUserStatus(usuario: Usuario) {
    const accion = usuario.estado ? 'desactivar' : 'activar';
    
    const confirmado = await this.sweetAlert.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      `¿Estás seguro de que quieres ${accion} a ${usuario.username}?`,
      'warning'
    );

    if (!confirmado) return;

    this.procesando = true;

    this.usuariosService.toggleUsuarioStatus(usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Estado actualizado:', response);
          
          // Actualizar el estado local del usuario
          usuario.estado = response.new_status;
          
          this.sweetAlert.success(
            'Estado actualizado',
            `Usuario ${usuario.estado ? 'activado' : 'desactivado'} correctamente`
          );
          
          this.procesando = false;
        },
        error: (error) => {
          console.error('❌ Error actualizando estado:', error);
          this.sweetAlert.error(
            'Error',
            'No se pudo actualizar el estado del usuario'
          );
          this.procesando = false;
        }
      });
  }

  trackByUserId(index: number, usuario: Usuario): number {
    return usuario.id;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }
}
