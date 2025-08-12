export interface Comentario {
  id: number;
  comment: string;
  userName: string;
  rating: number;
  productID: number;
  createdAt: string;
  producto?: {
    id: number;
    name: string;
    image_url: string;
  };
}

export interface CreateComentario {
  comment: string;
  userName: string;
  rating: number;
  productID: number;
}

export interface UpdateComentario {
  id: number;
  comment?: string;
  rating?: number;
}

export interface EstadisticasComentarios {
  totalComentarios: number;
  promedioRating: number;
  comentariosPorMes: { mes: string; cantidad: number }[];
  ratingDistribucion: { rating: number; cantidad: number }[];
}
