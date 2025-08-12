import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { ComentariosComponent } from './components/comentarios.component';
import { ProductosComponent } from './components/productos.component';
import { UsuariosComponent } from './components/usuarios.component';
import { EstadisticasComponent } from './components/estadisticas.component';
import { CategoriasComponent } from './components/categorias.component';
import { AdminLayoutComponent } from './components/admin-layout.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'dashboard', 
        component: DashboardComponent
      },
      { 
        path: 'comentarios', 
        component: ComentariosComponent
      },
      { 
        path: 'productos', 
        component: ProductosComponent
      },
      { 
        path: 'categorias', 
        component: CategoriasComponent
      },
      { 
        path: 'usuarios', 
        component: UsuariosComponent
      },
      { 
        path: 'estadisticas', 
        component: EstadisticasComponent
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
