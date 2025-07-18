

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
  // For RLS checks
  vendors?: { user_id: string } | null;
};

// This type is used in product listings after joining tables
export type ProductWithVendor = Product & {
  vendorId: string;
  vendorName: string;
};

export type ShoppingListItem = {
  id: number;
  user_id: string;
  product_name: string;
  vendor_name: string;
  price: number;
  quantity: number;
  image_url: string;
  bought: boolean;
  created_at: string;
};

export type Profile = {
    id: string;
    updated_at: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    mobile_number: string | null;
    // Scanner usage
    scan_count: number | null;
    last_scan_date: string | null; // as ISO string
    subscription_tier: string | null; // e.g., 'free', 'basic', 'pro'
    // Wellness data
    height: number | null; // in cm
    weight: number | null; // in kg
    wellness_goal: string | null;
    health_conditions: string | null; // e.g., "Diabetes, High Blood Pressure"
};

export type NutritionLog = {
    id: number;
    user_id: string;
    food_name: string;
    meal_type: string; // 'Breakfast', 'Lunch', 'Dinner', 'Snack'
    log_date: string; // YYYY-MM-DD
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at: string;
};

export type Meal = {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailyPlan = {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal;
  daily_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type WeeklyDietPlan = {
  monday: DailyPlan;
  tuesday: DailyPlan;
  wednesday: DailyPlan;
  thursday: DailyPlan;
  friday: DailyPlan;
  saturday: DailyPlan;
  sunday: DailyPlan;
};
