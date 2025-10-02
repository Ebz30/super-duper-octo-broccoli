import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed minimal data
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      hashedPassword: '$2b$10$h3C1d4W2aYz6rWJ1aQjIuO3P73j0vF6GdAYJTu9oJ3G4m9Gq2kzLu', // bcrypt hash for "Password1!"
    },
  });
  console.log('Seeded user', user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
