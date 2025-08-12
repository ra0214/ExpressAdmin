import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="admin-footer">
      <div class="footer-content">
        <!-- Información Principal -->
        <div class="footer-section">
          <div class="footer-brand">
            <div class="footer-logo">
              <i class="fas fa-palette"></i>
            </div>
            <div class="brand-info">
              <h4>EXPRESS Arte</h4>
              <p>Panel de Administración</p>
            </div>
          </div>
          <p class="footer-description">
            Sistema de gestión integral para productos artísticos, usuarios y comentarios.
            Desarrollado con tecnologías modernas para una experiencia óptima.
          </p>
        </div>

        <!-- Enlaces Rápidos -->
        <div class="footer-section">
          <h5>Enlaces Rápidos</h5>
          <ul class="footer-links">
            <li><a href="#"><i class="fas fa-home"></i> Dashboard</a></li>
            <li><a href="#"><i class="fas fa-box"></i> Productos</a></li>
            <li><a href="#"><i class="fas fa-users"></i> Usuarios</a></li>
            <li><a href="#"><i class="fas fa-comments"></i> Comentarios</a></li>
          </ul>
        </div>

        <!-- Tecnologías -->
        <div class="footer-section">
          <h5>Tecnologías</h5>
          <div class="tech-stack">
            <div class="tech-item">
              <i class="fab fa-angular"></i>
              <span>Angular 19</span>
            </div>
            <div class="tech-item">
              <i class="fab fa-js"></i>
              <span>TypeScript</span>
            </div>
            <div class="tech-item">
              <i class="fas fa-server"></i>
              <span>Go + Gin</span>
            </div>
            <div class="tech-item">
              <i class="fas fa-database"></i>
              <span>MySQL</span>
            </div>
          </div>
        </div>

        <!-- Información del Desarrollador -->
        <div class="footer-section">
          <h5>Desarrollado por</h5>
          <div class="developer-info">
            <div class="developer-avatar">
              <i class="fas fa-code"></i>
            </div>
            <div class="developer-details">
              <h6>Christian Raúl Mendoza Ramirez</h6>
              <p>Full Stack Developer</p>
              <div class="social-links">
                <a href="https://github.com/ra0214" title="GitHub">
                  <i class="fab fa-github"></i>
                </a>
                <a href="https://www.linkedin.com/in/christian-mendoza-developer" title="LinkedIn">
                  <i class="fab fa-linkedin"></i>
                </a>
                <a href="mailto:christianmendoza.dev@gmail.com" title="Email">
                  <i class="fas fa-envelope"></i>
                </a>
                <a href="#" title="Portfolio">
                  <i class="fas fa-globe"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <div class="copyright">
            <p>&copy; {{ currentYear }} EXPRESS Arte. Todos los derechos reservados.</p>
            <p>Desarrollado con <i class="fas fa-heart text-red"></i> por <strong>Christian Raúl Mendoza</strong></p>
          </div>
          <div class="footer-badges">
            <span class="badge">v1.0.0</span>
            <span class="badge">Angular {{ angularVersion }}</span>
            <span class="badge">Go API</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  angularVersion = '19';
}
