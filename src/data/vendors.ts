export type Product = {
  name: string;
  price: number;
  lowPrice?: boolean;
  discount?: string;
  image: string;
};

export type Vendor = {
  id: string;
  name: string;
  category: 'Produce' | 'Crafts' | 'Food' | 'Bakery';
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
      { name: 'Organic Apples', price: 3.99, image: 'https://placehold.co/100x100.png', lowPrice: true },
      { name: 'Heirloom Tomatoes', price: 4.50, image: 'https://placehold.co/100x100.png' },
      { name: 'Fresh Strawberries (1lb)', price: 5.00, image: 'https://placehold.co/100x100.png', discount: '15% off' },
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
      { name: 'Classic Sourdough Loaf', price: 8.00, image: 'https://placehold.co/100x100.png' },
      { name: 'Croissants (2-pack)', price: 6.50, image: 'https://placehold.co/100x100.png', discount: 'Buy 2 get 1 free' },
      { name: 'Cinnamon Buns', price: 4.50, image: 'https://placehold.co/100x100.png', lowPrice: true },
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
      { name: 'Ceramic Mug', price: 25.00, image: 'https://placehold.co/100x100.png' },
      { name: 'Silver Necklace', price: 45.00, image: 'https://placehold.co/100x100.png' },
      { name: 'Woven Blanket', price: 75.00, image: 'https://placehold.co/100x100.png' },
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
      { name: 'Carne Asada Tacos (3)', price: 12.00, image: 'https://placehold.co/100x100.png', discount: 'Lunch Special $10' },
      { name: 'Elote (Street Corn)', price: 5.00, image: 'https://placehold.co/100x100.png' },
      { name: 'Horchata', price: 4.00, image: 'https://placehold.co/100x100.png' },
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
        { name: 'Monstera Deliciosa', price: 30.00, image: 'https://placehold.co/100x100.png' },
        { name: 'Basil Plant', price: 5.00, image: 'https://placehold.co/100x100.png', lowPrice: true },
        { name: 'Organic Potting Mix', price: 10.00, image: 'https://placehold.co/100x100.png' },
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
        { name: 'Wildflower Honey (16oz)', price: 15.00, image: 'https://placehold.co/100x100.png', discount: '2 for $25' },
        { name: 'Beeswax Candles', price: 12.00, image: 'https://placehold.co/100x100.png' },
        { name: 'Honey Comb', price: 20.00, image: 'https://placehold.co/100x100.png' },
    ],
    hours: [{ day: 'Saturday', time: '9:00 AM - 2:00 PM' }],
    location: { lat: 30, lng: 55 },
    rating: 4.8,
  }
];
