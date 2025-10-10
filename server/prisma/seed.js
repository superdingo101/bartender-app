const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
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

  // Create bartender user
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

  // Create sample drinks
  const drinks = await Promise.all([
    prisma.drink.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Mojito',
        description: 'Classic Cuban cocktail with mint, lime, rum, and soda',
        category: 'COCKTAIL',
        imageUrl: '/images/mojito.jpg',
      },
    }),
    prisma.drink.upsert({
      where: { id: '2' },
      update: {},
      create: {
        id: '2',
        name: 'Margarita',
        description: 'Tequila, lime juice, and Cointreau served with salt rim',
        category: 'COCKTAIL',
        imageUrl: '/images/margarita.jpg',
      },
    }),
    prisma.drink.upsert({
      where: { id: '3' },
      update: {},
      create: {
        id: '3',
        name: 'Old Fashioned',
        description: 'Whiskey cocktail with bitters, sugar, and orange peel',
        category: 'COCKTAIL',
        imageUrl: '/images/old-fashioned.jpg',
      },
    }),
    prisma.drink.upsert({
      where: { id: '4' },
      update: {},
      create: {
        id: '4',
        name: 'IPA Beer',
        description: 'Hoppy India Pale Ale',
        category: 'BEER',
        imageUrl: '/images/ipa.jpg',
      },
    }),
    prisma.drink.upsert({
      where: { id: '5' },
      update: {},
      create: {
        id: '5',
        name: 'Red Wine',
        description: 'House red wine selection',
        category: 'WINE',
        imageUrl: '/images/red-wine.jpg',
      },
    }),
    prisma.drink.upsert({
      where: { id: '6' },
      update: {},
      create: {
        id: '6',
        name: 'Lemonade',
        description: 'Fresh squeezed lemonade',
        category: 'NON_ALCOHOLIC',
        imageUrl: '/images/lemonade.jpg',
      },
    }),
  ]);

  console.log('✅ Created drinks:', drinks.length);

  // Create sample event
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

  // Add drinks to event
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
  ]);

  console.log('✅ Added drinks to event:', eventDrinks.length);

  // Create sample ingredients
  const ingredients = await Promise.all([
    prisma.ingredient.upsert({
      where: { name: 'White Rum' },
      update: {},
      create: {
        name: 'White Rum',
        unit: 'oz',
        quantity: 100,
        minQuantity: 20,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Fresh Mint' },
      update: {},
      create: {
        name: 'Fresh Mint',
        unit: 'bunch',
        quantity: 10,
        minQuantity: 3,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Lime Juice' },
      update: {},
      create: {
        name: 'Lime Juice',
        unit: 'oz',
        quantity: 50,
        minQuantity: 10,
      },
    }),
  ]);

  console.log('✅ Created ingredients:', ingredients.length);

  console.log('🎉 Database seeded successfully!');
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