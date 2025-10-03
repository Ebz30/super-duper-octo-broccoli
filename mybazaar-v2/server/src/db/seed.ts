import { db } from './index';
import { categories } from './schema';

// Seed categories
const seedCategories = [
  {
    name: 'Electronics & Gadgets',
    slug: 'electronics',
    description: 'Laptops, phones, tablets, and electronic accessories',
    icon: 'laptop',
    emoji: '💻',
    sortOrder: 1,
  },
  {
    name: 'Books & Academic Materials',
    slug: 'books',
    description: 'Textbooks, notebooks, and study materials',
    icon: 'book',
    emoji: '📚',
    sortOrder: 2,
  },
  {
    name: 'Furniture & Home Decor',
    slug: 'furniture',
    description: 'Beds, desks, chairs, and home decorations',
    icon: 'home',
    emoji: '🛋️',
    sortOrder: 3,
  },
  {
    name: 'Clothing & Accessories',
    slug: 'fashion',
    description: 'Clothes, shoes, bags, and accessories',
    icon: 'shirt',
    emoji: '👕',
    sortOrder: 4,
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports',
    description: 'Gym equipment, sports gear, and fitness accessories',
    icon: 'dumbbell',
    emoji: '🏋️',
    sortOrder: 5,
  },
  {
    name: 'Kitchen & Appliances',
    slug: 'kitchen',
    description: 'Kitchen utensils, small appliances, and cookware',
    icon: 'utensils',
    emoji: '🍳',
    sortOrder: 6,
  },
  {
    name: 'Transportation',
    slug: 'transportation',
    description: 'Bicycles, scooters, and transportation items',
    icon: 'bike',
    emoji: '🚴',
    sortOrder: 7,
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Everything else',
    icon: 'grid',
    emoji: '📦',
    sortOrder: 8,
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Insert categories
    console.log('Inserting categories...');
    await db.insert(categories).values(seedCategories).onConflictDoNothing();

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
