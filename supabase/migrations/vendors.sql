-- Create a table for vendors, linked to a user account
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text,
  category text,
  image text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT vendors_pkey PRIMARY KEY (id),
  CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create a table for products, linked to a vendor
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  description text,
  image text,
  discount text,
  sizes text[],
  colors text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors (id) ON DELETE CASCADE
);

-- Add Policies for the Vendors Table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors are publicly visible." ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can create their own shop." ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vendors can update their own shop." ON public.vendors FOR UPDATE USING (auth.uid() = user_id);

-- Add Policies for the Products Table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly visible." ON public.products FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own products." ON public.products
  FOR ALL
  USING (
    (SELECT v.user_id FROM public.vendors v WHERE v.id = vendor_id) = auth.uid()
  );

-- Update the middleware redirect policy to include vendors
-- This function checks if a vendor's profile is complete
CREATE OR REPLACE FUNCTION is_vendor_profile_complete(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    is_complete boolean;
BEGIN
    SELECT (name IS NOT NULL AND category IS NOT NULL AND description IS NOT NULL)
    INTO is_complete
    FROM public.vendors
    WHERE user_id = p_user_id;
    RETURN COALESCE(is_complete, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;