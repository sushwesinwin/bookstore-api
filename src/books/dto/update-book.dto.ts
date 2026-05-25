export class UpdateBookDto {
  title?: string;
  author?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: string | null;
  isBestSeller?: boolean;
}
