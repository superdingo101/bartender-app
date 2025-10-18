// ============ MIGRATION STEPS ============
// 1. Update your schema.prisma file with the new schema
// 2. Run: npx prisma migrate dev --name add-ingredients-glass-equipment-instructions
// 3. Run: npx prisma generate
// 4. Run this seed script: node server/prisma/seed-enhanced.js

// ============ server/prisma/seed-enhanced.js ============
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding enhanced database...');

  // Seed Glass Types
  console.log('Creating glass types...');
  const glassTypes = await Promise.all([
    prisma.glassType.upsert({
      where: { name: 'Rocks Glass' },
      update: {},
      create: {
        name: 'Rocks Glass',
        description: 'Short tumbler for spirits on the rocks',
        capacity: 8.0,
      },
    }),
    prisma.glassType.upsert({
      where: { name: 'Highball Glass' },
      update: {},
      create: {
        name: 'Highball Glass',
        description: 'Tall glass for mixed drinks',
        capacity: 12.0,
      },
    }),
    prisma.glassType.upsert({
      where: { name: 'Martini Glass' },
      update: {},
      create: {
        name: 'Martini Glass',
        description: 'V-shaped glass with stem',
        capacity: 6.0,
      },
    }),
    prisma.glassType.upsert({
      where: { name: 'Margarita Glass' },
      update: {},
      create: {
        name: 'Margarita Glass',
        description: 'Wide-rimmed cocktail glass',
        capacity: 10.0,
      },
    }),
    prisma.glassType.upsert({
      where: { name: 'Collins Glass' },
      update: {},
      create: {
        name: 'Collins Glass',
        description: 'Tall narrow glass',
        capacity: 14.0,
      },
    }),
    prisma.glassType.upsert({
      where: { name: 'Coupe Glass' },
      update: {},
      create: {
        name: 'Coupe Glass',
        description: 'Shallow champagne-style glass',
        capacity: 7.0,
      },
    }),
  ]);
  console.log(`✓ Created ${glassTypes.length} glass types`);

  // Seed Equipment
  console.log('Creating equipment...');
  const equipment = await Promise.all([
    prisma.equipment.upsert({
      where: { name: 'Cocktail Shaker' },
      update: {},
      create: {
        name: 'Cocktail Shaker',
        description: 'For shaking cocktails with ice',
      },
    }),
    prisma.equipment.upsert({
      where: { name: 'Muddler' },
      update: {},
      create: {
        name: 'Muddler',
        description: 'For crushing herbs and fruit',
      },
    }),
    prisma.equipment.upsert({
      where: { name: 'Strainer' },
      update: {},
      create: {
        name: 'Strainer',
        description: 'For straining ice and pulp',
      },
    }),
    prisma.equipment.upsert({
      where: { name: 'Jigger' },
      update: {},
      create: {
        name: 'Jigger',
        description: 'Measuring tool for spirits',
      },
    }),
    prisma.equipment.upsert({
      where: { name: 'Bar Spoon' },
      update: {},
      create: {
        name: 'Bar Spoon',
        description: 'Long spoon for stirring',
      },
    }),
    prisma.equipment.upsert({
      where: { name: 'Blender' },
      update: {},
      create: {
        name: 'Blender',
        description: 'For frozen drinks',
      },
    }),
    prisma.equipment.upsert({
      where: { name: 'Citrus Juicer' },
      update: {},
      create: {
        name: 'Citrus Juicer',
        description: 'For fresh juice',
      },
    }),
  ]);
  console.log(`✓ Created ${equipment.length} equipment items`);

  // Seed Ingredients
  console.log('Creating ingredients...');
  const ingredients = await Promise.all([
    // Spirits
    prisma.ingredient.upsert({
      where: { name: 'Tequila Blanco' },
      update: {},
      create: {
        name: 'Tequila Blanco',
        type: 'Spirit',
        brand: 'Patron',
        unit: 'oz',
        quantity: 100,
        minQuantity: 10,
        bottlePrice: 45.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'White Rum' },
      update: {},
      create: {
        name: 'White Rum',
        type: 'Spirit',
        brand: 'Bacardi',
        unit: 'oz',
        quantity: 100,
        minQuantity: 10,
        bottlePrice: 22.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Vodka' },
      update: {},
      create: {
        name: 'Vodka',
        type: 'Spirit',
        brand: 'Grey Goose',
        unit: 'oz',
        quantity: 100,
        minQuantity: 10,
        bottlePrice: 38.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Gin' },
      update: {},
      create: {
        name: 'Gin',
        type: 'Spirit',
        brand: 'Tanqueray',
        unit: 'oz',
        quantity: 100,
        minQuantity: 10,
        bottlePrice: 28.99,
      },
    }),
    // Liqueurs
    prisma.ingredient.upsert({
      where: { name: 'Triple Sec' },
      update: {},
      create: {
        name: 'Triple Sec',
        type: 'Liqueur',
        brand: 'Cointreau',
        unit: 'oz',
        quantity: 50,
        minQuantity: 5,
        bottlePrice: 32.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Coffee Liqueur' },
      update: {},
      create: {
        name: 'Coffee Liqueur',
        type: 'Liqueur',
        brand: 'Kahlua',
        unit: 'oz',
        quantity: 50,
        minQuantity: 5,
        bottlePrice: 24.99,
      },
    }),
    // Juices
    prisma.ingredient.upsert({
      where: { name: 'Lime Juice' },
      update: {},
      create: {
        name: 'Lime Juice',
        type: 'Juice',
        brand: null,
        unit: 'oz',
        quantity: 64,
        minQuantity: 8,
        bottlePrice: 5.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Lemon Juice' },
      update: {},
      create: {
        name: 'Lemon Juice',
        type: 'Juice',
        brand: null,
        unit: 'oz',
        quantity: 64,
        minQuantity: 8,
        bottlePrice: 5.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Orange Juice' },
      update: {},
      create: {
        name: 'Orange Juice',
        type: 'Juice',
        brand: null,
        unit: 'oz',
        quantity: 128,
        minQuantity: 16,
        bottlePrice: 6.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Cranberry Juice' },
      update: {},
      create: {
        name: 'Cranberry Juice',
        type: 'Juice',
        brand: 'Ocean Spray',
        unit: 'oz',
        quantity: 128,
        minQuantity: 16,
        bottlePrice: 7.99,
      },
    }),
    // Syrups
    prisma.ingredient.upsert({
      where: { name: 'Simple Syrup' },
      update: {},
      create: {
        name: 'Simple Syrup',
        type: 'Syrup',
        brand: null,
        unit: 'oz',
        quantity: 32,
        minQuantity: 4,
        bottlePrice: 8.99,
      },
    }),
    // Mixers
    prisma.ingredient.upsert({
      where: { name: 'Club Soda' },
      update: {},
      create: {
        name: 'Club Soda',
        type: 'Mixer',
        brand: null,
        unit: 'oz',
        quantity: 200,
        minQuantity: 24,
        bottlePrice: 4.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Tonic Water' },
      update: {},
      create: {
        name: 'Tonic Water',
        type: 'Mixer',
        brand: 'Fever-Tree',
        unit: 'oz',
        quantity: 200,
        minQuantity: 24,
        bottlePrice: 12.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Ginger Beer' },
      update: {},
      create: {
        name: 'Ginger Beer',
        type: 'Mixer',
        brand: "Barritt's",
        unit: 'oz',
        quantity: 100,
        minQuantity: 12,
        bottlePrice: 15.99,
      },
    }),
    // Garnishes
    prisma.ingredient.upsert({
      where: { name: 'Fresh Mint' },
      update: {},
      create: {
        name: 'Fresh Mint',
        type: 'Garnish',
        brand: null,
        unit: 'piece',
        quantity: 50,
        minQuantity: 10,
        bottlePrice: 3.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Lime Wedge' },
      update: {},
      create: {
        name: 'Lime Wedge',
        type: 'Garnish',
        brand: null,
        unit: 'piece',
        quantity: 100,
        minQuantity: 20,
        bottlePrice: 4.99,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Salt' },
      update: {},
      create: {
        name: 'Salt',
        type: 'Garnish',
        brand: null,
        unit: 'dash',
        quantity: 1000,
        minQuantity: 100,
        bottlePrice: 2.99,
      },
    }),
  ]);
  console.log(`✓ Created ${ingredients.length} ingredients`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ============ EXAMPLE: Update an existing drink with new data ============
// Run this after seeding to add ingredients/equipment/instructions to an existing drink

async function updateExampleDrink() {
  const margarita = await prisma.drink.findFirst({
    where: { name: 'Margarita' }
  });

  if (!margarita) {
    console.log('Margarita drink not found');
    return;
  }

  const glassType = await prisma.glassType.findFirst({
    where: { name: 'Margarita Glass' }
  });

  const tequila = await prisma.ingredient.findFirst({
    where: { name: 'Tequila Blanco' }
  });

  const tripleSec = await prisma.ingredient.findFirst({
    where: { name: 'Triple Sec' }
  });

  const limeJuice = await prisma.ingredient.findFirst({
    where: { name: 'Lime Juice' }
  });

  const salt = await prisma.ingredient.findFirst({
    where: { name: 'Salt' }
  });

  const limeWedge = await prisma.ingredient.findFirst({
    where: { name: 'Lime Wedge' }
  });

  const shaker = await prisma.equipment.findFirst({
    where: { name: 'Cocktail Shaker' }
  });

  const strainer = await prisma.equipment.findFirst({
    where: { name: 'Strainer' }
  });

  await prisma.drink.update({
    where: { id: margarita.id },
    data: {
      glassTypeId: glassType?.id,
      ingredients: {
        create: [
          { ingredientId: tequila.id, quantity: 2, unit: 'oz' },
          { ingredientId: tripleSec.id, quantity: 1, unit: 'oz' },
          { ingredientId: limeJuice.id, quantity: 1, unit: 'oz' },
          { ingredientId: salt.id, quantity: 1, unit: 'dash' },
          { ingredientId: limeWedge.id, quantity: 1, unit: 'piece' },
        ],
      },
      equipment: {
        create: [
          { equipmentId: shaker.id },
          { equipmentId: strainer.id },
        ],
      },
      instructions: {
        create: [
          { stepNumber: 1, instruction: 'Rim the glass with salt by running a lime wedge around the edge and dipping in salt' },
          { stepNumber: 2, instruction: 'Add tequila, triple sec, and lime juice to shaker with ice' },
          { stepNumber: 3, instruction: 'Shake vigorously for 15 seconds' },
          { stepNumber: 4, instruction: 'Strain into the salt-rimmed glass over fresh ice' },
          { stepNumber: 5, instruction: 'Garnish with lime wedge' },
        ],
      },
    },
  });

  console.log('✓ Updated Margarita with ingredients, equipment, and instructions');
}

// Uncomment to run the example update:
// updateExampleDrink().finally(() => prisma.$disconnect());