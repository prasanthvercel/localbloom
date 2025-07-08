export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  lowPrice?: boolean;
  discount?: string;
  image: string;
  sizes?: string[];
  colors?: string[];
};

export type Vendor = {
  id: string;
  name: string;
  category: 'Produce' | 'Crafts' | 'Food' | 'Bakery' | 'Clothing';
  image: string;
  description: string;
  products: Product[];
  hours: { day: string; time:string }[];
  location: { lat: number; lng: number };
  rating: number;
};

export const vendors: Vendor[] = [
  {
    id: 'fresh-farms',
    name: 'Fresh Farms Organics',
    category: 'Produce',
    image: 'https://placehold.co/400x250.png',
    description: 'Family-owned farm offering the freshest seasonal and organic vegetables and fruits.',
    products: [
      { id: 'ffo-001', name: 'Organic Apples', price: 3.99, image: 'https://placehold.co/100x100.png', lowPrice: true, description: "Crisp, sweet, and juicy organic gala apples, perfect for snacking or baking." },
      { id: 'ffo-002', name: 'Heirloom Tomatoes', price: 4.50, image: 'https://placehold.co/100x100.png', description: "A vibrant mix of seasonal heirloom tomatoes, bursting with flavor." },
      { id: 'ffo-003', name: 'Fresh Strawberries (1lb)', price: 5.00, image: 'https://placehold.co/100x100.png', discount: '15% off', description: "Freshly picked, sweet strawberries from our local fields." },
      { id: 'ffo-004', name: 'Organic Rice (1kg)', price: 6.50, image: 'https://placehold.co/100x100.png', description: "Nutritious and delicious long-grain organic white rice." },
    ],
    hours: [
      { day: 'Saturday', time: '8:00 AM - 2:00 PM' },
      { day: 'Sunday', time: '9:00 AM - 1:00 PM' },
    ],
    location: { lat: 45, lng: 30 },
    rating: 4.8,
  },
  {
    id: 'sourdough-delights',
    name: 'Sourdough Delights',
    category: 'Bakery',
    image: 'https://placehold.co/400x250.png',
    description: 'Artisanal sourdough bread and pastries, baked fresh daily using traditional methods.',
    products: [
      { id: 'sd-001', name: 'Classic Sourdough Loaf', price: 8.00, image: 'https://placehold.co/100x100.png', description: "Our signature loaf with a tangy flavor and a perfectly crisp crust." },
      { id: 'sd-002', name: 'Croissants (2-pack)', price: 6.50, image: 'https://placehold.co/100x100.png', discount: 'Buy 2 get 1 free', description: "Buttery, flaky, and golden-brown croissants, made with real butter." },
      { id: 'sd-003', name: 'Cinnamon Buns', price: 4.50, image: 'https://placehold.co/100x100.png', lowPrice: true, description: "Gooey, soft cinnamon buns topped with a sweet cream cheese frosting." },
    ],
    hours: [{ day: 'Saturday', time: '8:00 AM - 1:00 PM' }],
    location: { lat: 60, lng: 70 },
    rating: 4.9,
  },
  {
    id: 'crafted-creations',
    name: 'Crafted Creations',
    category: 'Crafts',
    image: 'https://placehold.co/400x250.png',
    description: 'Handmade pottery, jewelry, and textiles from local artisans. Unique gifts and home decor.',
    products: [
      { id: 'cc-001', name: 'Ceramic Mug', price: 25.00, image: 'https://placehold.co/100x100.png', description: "A beautifully handcrafted ceramic mug, perfect for your morning coffee or tea." },
      { id: 'cc-002', name: 'Silver Necklace', price: 45.00, image: 'https://placehold.co/100x100.png', description: "An elegant sterling silver necklace with a unique, handcrafted pendant." },
      { id: 'cc-003', name: 'Woven Blanket', price: 75.00, image: 'https://placehold.co/100x100.png', description: "A cozy and soft woven blanket, made from natural fibers. Adds a touch of warmth to any room." },
    ],
    hours: [{ day: 'Saturday', time: '9:00 AM - 3:00 PM' }],
    location: { lat: 25, lng: 75 },
    rating: 4.7,
  },
  {
    id: 'taco-fiesta',
    name: 'Taco Fiesta',
    category: 'Food',
    image: 'https://placehold.co/400x250.png',
    description: 'Authentic street tacos with a modern twist. Fresh ingredients and bold flavors.',
    products: [
      { id: 'tf-001', name: 'Carne Asada Tacos (3)', price: 12.00, image: 'https://placehold.co/100x100.png', discount: 'Lunch Special $10', description: "Three grilled steak tacos on corn tortillas with onion, cilantro, and salsa." },
      { id: 'tf-002', name: 'Elote (Street Corn)', price: 5.00, image: 'https://placehold.co/100x100.png', description: "Grilled corn on the cob slathered in a creamy chili-lime sauce and topped with cotija cheese." },
      { id: 'tf-003', name: 'Horchata', price: 4.00, image: 'https://placehold.co/100x100.png', description: "A refreshing and sweet traditional rice milk drink with a hint of cinnamon." },
    ],
    hours: [{ day: 'Saturday', time: '10:00 AM - 3:00 PM' }],
    location: { lat: 70, lng: 50 },
    rating: 4.6,
  },
  {
    id: 'green-thumb-nursery',
    name: 'Green Thumb Nursery',
    category: 'Produce',
    image: 'https://placehold.co/400x250.png',
    description: 'A wide variety of indoor and outdoor plants, herbs, and gardening supplies.',
    products: [
        { id: 'gtn-001', name: 'Monstera Deliciosa', price: 30.00, image: 'https://placehold.co/100x100.png', description: "A popular and easy-to-care-for houseplant with iconic split leaves." },
        { id: 'gtn-002', name: 'Basil Plant', price: 5.00, image: 'https://placehold.co/100x100.png', lowPrice: true, description: "A fragrant basil plant, perfect for your kitchen windowsill and home cooking." },
        { id: 'gtn-003', name: 'Organic Potting Mix', price: 10.00, image: 'https://placehold.co/100x100.png', description: "A nutrient-rich potting mix to help your plants thrive." },
    ],
    hours: [
        { day: 'Saturday', time: '8:00 AM - 4:00 PM' },
        { day: 'Sunday', time: '10:00 AM - 2:00 PM' },
    ],
    location: { lat: 80, lng: 20 },
    rating: 4.9,
  },
  {
    id: 'honey-hive',
    name: 'The Honey Hive',
    category: 'Produce',
    image: 'https://placehold.co/400x250.png',
    description: 'Local, raw honey and beeswax products straight from our happy bees.',
    products: [
        { id: 'hh-001', name: 'Wildflower Honey (16oz)', price: 15.00, image: 'https://placehold.co/100x100.png', discount: '2 for $25', description: "Pure, unfiltered wildflower honey with a rich and complex flavor." },
        { id: 'hh-002', name: 'Beeswax Candles', price: 12.00, image: 'https://placehold.co/100x100.png', description: "A pair of hand-poured beeswax candles that burn clean and have a subtle honey scent." },
        { id: 'hh-003', name: 'Honey Comb', price: 20.00, image: 'https://placehold.co/100x100.png', description: "A beautiful block of natural honeycomb, perfect for cheese boards or spreading on toast." },
    ],
    hours: [{ day: 'Saturday', time: '9:00 AM - 2:00 PM' }],
    location: { lat: 30, lng: 55 },
    rating: 4.8,
  },
  {
    id: 'pantry-staples',
    name: 'Pantry Staples Co.',
    category: 'Food',
    image: 'https://placehold.co/400x250.png',
    description: 'All your essential pantry needs, from grains to spices, at the best prices.',
    products: [
        { id: 'psc-001', name: 'Organic Rice (1kg)', price: 5.99, image: 'https://placehold.co/100x100.png', description: "High-quality organic long-grain rice, a staple for any pantry." },
        { id: 'psc-002', name: 'All-Purpose Flour (2kg)', price: 4.00, image: 'https://placehold.co/100x100.png', description: "Versatile all-purpose flour for all your baking needs." },
        { id: 'psc-003', name: 'Canned Chickpeas', price: 1.50, image: 'https://placehold.co/100x100.png', lowPrice: true, description: "Organic chickpeas, perfect for making hummus, salads, and stews." },
    ],
    hours: [{ day: 'Saturday', time: '9:00 AM - 3:00 PM' }],
    location: { lat: 50, lng: 60 },
    rating: 4.5,
  },
  {
    id: 'artisan-threads',
    name: 'Artisan Threads',
    category: 'Clothing',
    image: 'https://placehold.co/400x250.png',
    description: 'Handcrafted, sustainable clothing made with natural dyes and organic fabrics.',
    products: [
        { id: 'at-001', name: 'Organic Cotton T-Shirt', price: 35.00, image: 'https://placehold.co/100x100.png', description: "A super soft and comfortable t-shirt made from 100% organic cotton. Perfect for everyday wear.", sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Black', 'Heather Grey'] },
        { id: 'at-002', name: 'Linen Trousers', price: 85.00, image: 'https://placehold.co/100x100.png', discount: '10% off', description: "Lightweight and breathable linen trousers with a relaxed fit.", sizes: ['S', 'M', 'L'], colors: ['Beige', 'Navy'] },
        { id: 'at-003', name: 'Hand-dyed Scarf', price: 45.00, image: 'https://placehold.co/100x100.png', lowPrice: true, description: "A beautiful scarf hand-dyed with natural plant-based pigments.", colors: ['Indigo', 'Turmeric', 'Madder Root'] },
    ],
    hours: [{ day: 'Saturday', time: '10:00 AM - 4:00 PM' }],
    location: { lat: 15, lng: 15 },
    rating: 4.9,
  }
];
