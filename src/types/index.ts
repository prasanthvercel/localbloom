
export type Product = {
  id: string;
  vendor_id: string;
  name: string;
  price: number;
  unit?: string | null;
  description?: string | null;
  discount?: string | null;
  image?: string | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  created_at: string;
  updated_at?: string | null;
  // For client-side logic
  lowPrice?: boolean;
};

export type Vendor = {
  id: string;
  user_id: string;
  name: string | null;
  category: string | null;
  image: string | null;
  description: string | null;
  created_at: string;
  updated_at?: string | null;
  // For client-side logic / joins
  products?: Product[];
};

// This type is used in product listings after joining tables
export type ProductWithVendor = Product & {
  vendorId: string;
  vendorName: string;
};
