export interface DashboardData {
  estadisticas: EstadisticasGenerales;
  graficos: DatosGraficos;
  actividadReciente: ActividadReciente[];
  alertas: Alerta[];
}

export interface EstadisticasGenerales {
  totalProductos: number;
  totalUsuarios: number;
  totalComentarios: number;
  promedioRating: number;
  ventasDelMes: number;
  crecimientoMensual: number;
}

export interface DatosGraficos {
  ventasPorMes: { mes: string; ventas: number }[];
  productosMasVendidos: { producto: string; cantidad: number }[];
  usuariosPorMes: { mes: string; usuarios: number }[];
  ratingPromedioPorCategoria: { categoria: string; rating: number }[];
}

export interface ActividadReciente {
  id: number;
  tipo: 'producto' | 'usuario' | 'comentario';
  accion: 'crear' | 'actualizar' | 'eliminar';
  descripcion: string;
  fecha: string;
  usuario: string;
}

export interface Alerta {
  id: number;
  tipo: 'info' | 'warning' | 'error' | 'success';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}
