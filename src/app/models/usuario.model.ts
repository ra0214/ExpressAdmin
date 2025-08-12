export interface Usuario {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  last_login?: string;
  activo: boolean;
}

export interface CreateUsuario {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface UpdateUsuario {
  id: number;
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
  activo?: boolean;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    userName: string;
    email: string;
  };
}

export interface EstadisticasUsuarios {
  totalUsuarios: number;
  usuariosActivos: number;
  administradores: number;
  nuevosUsuarios: number;
}
