import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="admin-header">
      <div class="header-content">
        <div class="header-left">
          <button class="btn-back" (click)="volverAlDashboard()">
            <i class="fas fa-arrow-left"></i>
            <span>Volver al Dashboard</span>
          </button>
        </div>
        
        <div class="header-center">
          <div class="logo-container">
            <img src="images/logo.jpg" alt="Logo Express" class="logo" (error)="onImageError($event)">
            <h1 class="company-name">Panel de Administración</h1>
          </div>
        </div>
        
        <div class="header-right">
          <div class="user-info">
            <i class="fas fa-user-shield"></i>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-left,
    .header-right {
      flex: 1;
    }

    .header-center {
      flex: 2;
      display: flex;
      justify-content: center;
    }

    .btn-back {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .btn-back:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .btn-back i {
      font-size: 0.8rem;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo {
      height: 50px;
      width: auto;
      border-radius: 8px;
      max-width: 200px;
      object-fit: contain;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .fallback-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 1.5rem;
      color: #ffd700;
    }

    .company-name {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-end;
      font-size: 0.9rem;
    }

    .user-info i {
      font-size: 1.1rem;
      color: #ffd700;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .admin-header {
        padding: 0.75rem 1rem;
      }

      .company-name {
        font-size: 1.2rem;
      }

      .btn-back span {
        display: none;
      }

      .header-left,
      .header-right {
        flex: 0.5;
      }

      .header-center {
        flex: 3;
      }
    }

    @media (max-width: 480px) {
      .logo-container {
        flex-direction: column;
        gap: 0.5rem;
      }

      .logo {
        height: 35px;
      }

      .company-name {
        font-size: 1rem;
        text-align: center;
      }
    }
  `]
})
export class HeaderComponent {
  
  constructor(private router: Router) {}

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onImageError(event: any): void {
    // Si no se puede cargar la imagen del logo, usar un ícono por defecto
    const imgElement = event.target;
    imgElement.style.display = 'none';
    
    // Verificar si ya existe un ícono de reemplazo
    const existingIcon = imgElement.parentNode.querySelector('.fallback-logo');
    if (!existingIcon) {
      const icon = document.createElement('div');
      icon.className = 'fallback-logo';
      icon.innerHTML = '<i class="fas fa-building"></i>';
      icon.style.cssText = `
        font-size: 2rem;
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      `;
      imgElement.parentNode.insertBefore(icon, imgElement);
    }
  }
}
