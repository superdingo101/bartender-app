const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ===== STEP 1: Seed Drink Categories =====
  console.log('\n📂 Seeding drink categories...');
  
  const categories = [
    { name: 'COCKTAIL', displayName: 'Cocktails', icon: '🍸' },
    { name: 'BEER', displayName: 'Beer', icon: '🍺' },
    { name: 'WINE', displayName: 'Wine', icon: '🍷' },
    { name: 'SPIRITS', displayName: 'Spirits', icon: '🥃' },
    { name: 'NON_ALCOHOLIC', displayName: 'Non-Alcoholic', icon: '🥤' },
    { name: 'SPECIALTY', displayName: 'Specialty', icon: '✨' },
  ];

  const seededCategories = await Promise.all(
    categories.map(cat =>
      prisma.drinkCategoryEnum.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      })
    )
  );

  console.log('✅ Seeded categories:', seededCategories.map(c => c.name).join(', '));

  // ===== STEP 2: Create Users =====
  console.log('\n👤 Creating users...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bartending.app' },
    update: {},
    create: {
      email: 'admin@bartending.app',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  const bartender = await prisma.user.upsert({
    where: { email: 'bartender@bartending.app' },
    update: {},
    create: {
      email: 'bartender@bartending.app',
      password: await bcrypt.hash('bartender123', 10),
      name: 'John Bartender',
      role: 'BARTENDER',
    },
  });

  console.log('✅ Created bartender user:', bartender.email);

  // ===== STEP 3: Create Drinks with Multiple Categories =====
  console.log('\n🍹 Creating drinks...');

  const drinks = await Promise.all([
    prisma.drink.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Mojito',
        description: 'Classic Cuban cocktail with mint, lime, rum, and soda',
        imageUrl: '/images/mojito.jpg',
        categories: {
          create: [
            { categoryName: 'COCKTAIL', isPrimary: true },
            { categoryName: 'SPECIALTY', isPrimary: false },
          ],
        },
      },
    }),
    prisma.drink.upsert({
      where: { id: '2' },
      update: {},
      create: {
        id: '2',
        name: 'Margarita',
        description: 'Tequila, lime juice, and Cointreau served with salt rim',
        imageUrl: '/images/margarita.jpg',
        categories: {
          create: [
            { categoryName: 'COCKTAIL', isPrimary: true },
          ],
        },
      },
    }),
    prisma.drink.upsert({
      where: { id: '3' },
      update: {},
      create: {
        id: '3',
        name: 'Old Fashioned',
        description: 'Whiskey cocktail with bitters, sugar, and orange peel',
        imageUrl: '/images/old-fashioned.jpg',
        categories: {
          create: [
            { categoryName: 'COCKTAIL', isPrimary: true },
            { categoryName: 'SPIRITS', isPrimary: false },
          ],
        },
      },
    }),
    prisma.drink.upsert({
      where: { id: '4' },
      update: {},
      create: {
        id: '4',
        name: 'IPA Beer',
        description: 'Hoppy India Pale Ale',
        imageUrl: '/images/ipa.jpg',
        categories: {
          create: [
            { categoryName: 'BEER', isPrimary: true },
          ],
        },
      },
    }),
    prisma.drink.upsert({
      where: { id: '5' },
      update: {},
      create: {
        id: '5',
        name: 'Red Wine',
        description: 'House red wine selection',
        imageUrl: '/images/red-wine.jpg',
        categories: {
          create: [
            { categoryName: 'WINE', isPrimary: true },
          ],
        },
      },
    }),
    prisma.drink.upsert({
      where: { id: '6' },
      update: {},
      create: {
        id: '6',
        name: 'Lemonade',
        description: 'Fresh squeezed lemonade',
        imageUrl: '/images/lemonade.jpg',
        categories: {
          create: [
            { categoryName: 'NON_ALCOHOLIC', isPrimary: true },
          ],
        },
      },
    }),
    prisma.drink.upsert({
      where: { id: '7' },
      update: {},
      create: {
        id: '7',
        name: 'Mai Tai',
        description: 'Classic tropical rum-based cocktail',
        imageUrl: '/images/mai-tai.jpg',
        categories: {
          create: [
            { categoryName: 'COCKTAIL', isPrimary: true },
            { categoryName: 'SPECIALTY', isPrimary: false },
            { categoryName: 'SPIRITS', isPrimary: false },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Created drinks:', drinks.length);

  // ===== STEP 4: Create Event =====
  console.log('\n📅 Creating event...');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const event = await prisma.event.upsert({
    where: { code: 'SUMMER2024' },
    update: {},
    create: {
      name: 'Summer Pool Party',
      description: 'Annual summer celebration with tropical drinks',
      date: futureDate,
      location: 'Rooftop Pool, Downtown',
      code: 'SUMMER2024',
      status: 'UPCOMING',
      hostId: admin.id,
    },
  });

  console.log('✅ Created event:', event.name);

  // ===== STEP 5: Add Drinks to Event =====
  console.log('\n🍷 Adding drinks to event...');

  const eventDrinks = await Promise.all([
    prisma.eventDrink.upsert({
      where: {
        eventId_drinkId: {
          eventId: event.id,
          drinkId: '1',
        },
      },
      update: {},
      create: {
        eventId: event.id,
        drinkId: '1',
        price: 12.00,
        available: true,
      },
    }),
    prisma.eventDrink.upsert({
      where: {
        eventId_drinkId: {
          eventId: event.id,
          drinkId: '2',
        },
      },
      update: {},
      create: {
        eventId: event.id,
        drinkId: '2',
        price: 11.00,
        available: true,
      },
    }),
    prisma.eventDrink.upsert({
      where: {
        eventId_drinkId: {
          eventId: event.id,
          drinkId: '3',
        },
      },
      update: {},
      create: {
        eventId: event.id,
        drinkId: '3',
        price: 14.00,
        available: true,
      },
    }),
    prisma.eventDrink.upsert({
      where: {
        eventId_drinkId: {
          eventId: event.id,
          drinkId: '4',
        },
      },
      update: {},
      create: {
        eventId: event.id,
        drinkId: '4',
        price: 7.00,
        available: true,
      },
    }),
    prisma.eventDrink.upsert({
      where: {
        eventId_drinkId: {
          eventId: event.id,
          drinkId: '6',
        },
      },
      update: {},
      create: {
        eventId: event.id,
        drinkId: '6',
        price: 4.00,
        available: true,
      },
    }),
    prisma.eventDrink.upsert({
      where: {
        eventId_drinkId: {
          eventId: event.id,
          drinkId: '7',
        },
      },
      update: {},
      create: {
        eventId: event.id,
        drinkId: '7',
        price: 13.50,
        available: true,
      },
    }),
  ]);

  console.log('✅ Added drinks to event:', eventDrinks.length);

  // ===== STEP 6: Create Sample Ingredients =====
  console.log('\n🧂 Creating ingredients...');

  const ingredients = await Promise.all([
    prisma.ingredient.upsert({
      where: { name: 'White Rum' },
      update: {
        type: 'Spirit',
      },
      create: {
        name: 'White Rum',
        type: 'Spirit',
        unit: 'oz',
        quantity: 100,
        minQuantity: 20,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Fresh Mint' },
      update: {
        type: 'Garnish',
      },
      create: {
        name: 'Fresh Mint',
        type: 'Garnish',
        unit: 'bunch',
        quantity: 10,
        minQuantity: 3,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Lime Juice' },
      update: {
        type: 'Juice',
      },
      create: {
        name: 'Lime Juice',
        type: 'Juice',
        unit: 'oz',
        quantity: 50,
        minQuantity: 10,
      },
    }),
  ]);

  console.log('✅ Created ingredients:', ingredients.length);

  console.log('\n🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('   Admin: admin@bartending.app / admin123');
  console.log('   Bartender: bartender@bartending.app / bartender123');
  console.log('   Event code: SUMMER2024');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
