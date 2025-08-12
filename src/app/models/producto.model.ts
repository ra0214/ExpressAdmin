export interface Producto {
  id: number;
  name: string;        
  description: string; 
  price: number;       
  category: string;    
  image_url: string;   
  stock: number;       
  created_at: string;  
  updated_at: string;  
}

export interface CreateProducto {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
}

export interface UpdateProducto {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
  stock?: number;
}

export interface CategoriaProducto {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  activa: boolean;
}

export interface FiltroProductos {
  categoria?: string;
  precioMin?: number;
  precioMax?: number;
  busqueda?: string;
  ordenPor?: 'name' | 'price' | 'created_at';
  orden?: 'asc' | 'desc';
  limite?: number;
  pagina?: number;
}

export interface EstadisticasProductos {
  totalProductos: number;
  productosActivos: number;
  productosAgotados: number;
  valorInventario: number;
  categorias: { [key: string]: number };
}
