const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  { name: 'COCKTAIL', displayName: 'Cocktails', icon: '🍸' },
  { name: 'BEER', displayName: 'Beer', icon: '🍺' },
  { name: 'WINE', displayName: 'Wine', icon: '🍷' },
  { name: 'SPIRITS', displayName: 'Spirits', icon: '🥃' },
  { name: 'NON_ALCOHOLIC', displayName: 'Non-Alcoholic', icon: '🥤' },
  { name: 'SPECIALTY', displayName: 'Specialty', icon: '✨' },
];

const drinks = [
  { id: '1', name: 'Mojito', description: 'Classic Cuban cocktail with mint, lime, rum, and soda', imageUrl: '/images/mojito.jpg', categories: ['COCKTAIL', 'SPECIALTY'] },
  { id: '2', name: 'Margarita', description: 'Tequila, lime juice, and Cointreau served with salt rim', imageUrl: '/images/margarita.jpg', categories: ['COCKTAIL'] },
  { id: '3', name: 'Old Fashioned', description: 'Whiskey cocktail with bitters, sugar, and orange peel', imageUrl: '/images/old-fashioned.jpg', categories: ['COCKTAIL', 'SPIRITS'] },
  { id: '4', name: 'IPA Beer', description: 'Hoppy India Pale Ale', imageUrl: '/images/ipa.jpg', categories: ['BEER'] },
  { id: '5', name: 'Red Wine', description: 'House red wine selection', imageUrl: '/images/red-wine.jpg', categories: ['WINE'] },
  { id: '6', name: 'Lemonade', description: 'Fresh squeezed lemonade', imageUrl: '/images/lemonade.jpg', categories: ['NON_ALCOHOLIC'] },
  { id: '7', name: 'Mai Tai', description: 'Classic tropical rum-based cocktail', imageUrl: '/images/mai-tai.jpg', categories: ['COCKTAIL', 'SPECIALTY', 'SPIRITS'] },
];

const eventDrinkPrices = {
  Mojito: 12.00,
  Margarita: 11.00,
  'Old Fashioned': 14.00,
  'IPA Beer': 7.00,
  Lemonade: 4.00,
  'Mai Tai': 13.50,
};

const ingredients = [
  { name: 'White Rum', type: 'Spirit', unit: 'oz', quantity: 100, minQuantity: 20 },
  { name: 'Fresh Mint', type: 'Garnish', unit: 'bunch', quantity: 10, minQuantity: 3 },
  { name: 'Lime Juice', type: 'Juice', unit: 'oz', quantity: 50, minQuantity: 10 },
];

async function seedDemoContent(client = prisma) {
  console.log('🌱 Starting demo content seed...');
  console.log('🔐 No users or default credentials are created by this seed.');

  await Promise.all(categories.map((category) => client.drinkCategoryEnum.upsert({
    where: { name: category.name },
    update: { displayName: category.displayName, icon: category.icon },
    create: category,
  })));

  const seededDrinks = await Promise.all(drinks.map(async (drink) => {
    const seededDrink = await client.drink.upsert({
      where: { name: drink.name },
      update: { description: drink.description, imageUrl: drink.imageUrl },
      create: { id: drink.id, name: drink.name, description: drink.description, imageUrl: drink.imageUrl },
    });

    await Promise.all(drink.categories.map((categoryName, index) => client.drinkCategory.upsert({
      where: { drinkId_categoryName: { drinkId: seededDrink.id, categoryName } },
      update: { isPrimary: index === 0 },
      create: { drinkId: seededDrink.id, categoryName, isPrimary: index === 0 },
    })));

    return seededDrink;
  }));

  const eventDate = new Date('2026-07-04T19:00:00.000Z');
  const event = await client.event.upsert({
    where: { code: 'SUMMER2026' },
    update: {
      name: 'Summer Pool Party',
      description: 'Annual summer celebration with tropical drinks',
      date: eventDate,
      location: 'Rooftop Pool, Downtown',
      status: 'UPCOMING',
      hidePrices: false,
    },
    create: {
      name: 'Summer Pool Party',
      description: 'Annual summer celebration with tropical drinks',
      date: eventDate,
      location: 'Rooftop Pool, Downtown',
      code: 'SUMMER2026',
      status: 'UPCOMING',
      hidePrices: false,
    },
  });

  const drinkIdsByName = seededDrinks.reduce((accumulator, drink) => ({
    ...accumulator,
    [drink.name]: drink.id,
  }), {});

  await Promise.all(Object.entries(eventDrinkPrices).map(([drinkName, price]) => {
    const drinkId = drinkIdsByName[drinkName];

    return client.eventDrink.upsert({
      where: { eventId_drinkId: { eventId: event.id, drinkId } },
      update: { price, available: true },
      create: { eventId: event.id, drinkId, price, available: true },
    });
  }));

  await Promise.all(ingredients.map((ingredient) => client.ingredient.upsert({
    where: { name: ingredient.name },
    update: { type: ingredient.type, unit: ingredient.unit, quantity: ingredient.quantity, minQuantity: ingredient.minQuantity },
    create: ingredient,
  })));

  console.log('🎉 Demo content seeded successfully. Event code: SUMMER2026');
}

if (require.main === module) {
  seedDemoContent()
    .catch((error) => {
      console.error('❌ Error seeding demo content:', error);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}

module.exports = { seedDemoContent, categories, drinks };
