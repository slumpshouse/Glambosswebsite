export type Product = {
  id: number;
  name: string;
  category: string;
  cost: number | null;
  stock: number;
  imageUrl: string;
  description: string;
};

export type ProductInput = {
  name: string;
  category: string;
  cost: number;
  stock: number;
  imageUrl: string;
  description: string;
};

export type ProductUpdateInput = Partial<ProductInput>;
