const { prisma } = require('../services/database');
const { emitDrinkAvailabilityUpdate } = require('../services/socket');

// Get all drinks with filtering and search (UPDATED with new relations)
const getAllDrinks = async (req, res, next) => {
  try {
    const { category, search, available } = req.query;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const drinks = await prisma.drink.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        _count: {
          select: {
            events: true,
            orders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const filtered = category
      ? drinks.filter(d => d.categories.some(dc => dc.category.name === category))
      : drinks;

    res.json({ drinks: filtered });
  } catch (error) {
    next(error);
  }
};

// Get single drink by ID (UPDATED with new relations)
const getDrinkById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const drink = await prisma.drink.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
        ingredients: {
          include: {
            ingredient: true,
          },
          orderBy: {
            ingredient: {
              name: 'asc',
            },
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                date: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!drink) {
      return res.status(404).json({ error: 'Drink not found' });
    }

    res.json({ drink });
  } catch (error) {
    next(error);
  }
};

// Get drinks by category (no changes needed)
const getDrinksByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const validCategories = [
      'COCKTAIL',
      'BEER',
      'WINE',
      'SPIRITS',
      'NON_ALCOHOLIC',
      'SPECIALTY',
    ];

    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories,
      });
    }

    const drinks = await prisma.drink.findMany({
      where: {
        categories: {
          some: {
            category: {
              name: category.toUpperCase(),
            },
          },
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ drinks, category: category.toUpperCase() });
  } catch (error) {
    next(error);
  }
};

// Create new drink (UPDATED to handle new features)
const createDrink = async (req, res, next) => {
  try {
    const { 
      name, 
      description, 
      categories, 
      imageUrl, 
      glassTypeId,
      ingredients,
      equipment,
      instructions
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }

    const validCategories = [
      'COCKTAIL',
      'BEER',
      'WINE',
      'SPIRITS',
      'NON_ALCOHOLIC',
      'SPECIALTY',
    ];

    for (const cat of categories) {
      if (!validCategories.includes(cat.name)) {
        return res.status(400).json({
          error: `Invalid category: ${cat.name}`,
          validCategories,
        });
      }
    }

    // Build the create data object
    const createData = {
      name: name.trim(),
      description: description?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      ...(glassTypeId && { glassType: { connect: { id: glassTypeId } } }),
      categories: {
        create: categories.map((cat, index) => ({
          categoryName: cat.name,
          isPrimary: cat.isPrimary || index === 0,
        })),
      },
    };

    // Add ingredients if provided
    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      createData.ingredients = {
        create: ingredients.map(ing => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      };
    }

    // Add equipment if provided
    if (equipment && Array.isArray(equipment) && equipment.length > 0) {
      createData.equipment = {
        create: equipment.map(eq => ({
          equipmentId: eq.equipmentId,
        })),
      };
    }

    // Add instructions if provided
    if (instructions && Array.isArray(instructions) && instructions.length > 0) {
      createData.instructions = {
        create: instructions.map((inst, index) => ({
          stepNumber: inst.stepNumber || index + 1,
          instruction: inst.instruction.trim(),
        })),
      };
    }

    const drink = await prisma.drink.create({
      data: createData,
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    });

    res.status(201).json({
      message: 'Drink created successfully',
      drink,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A drink with this name already exists',
      });
    }
    console.error('Error creating drink:', error);
    next(error);
  }
};

// Update drink (UPDATED to handle new features)
const updateDrink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      categories, 
      imageUrl, 
      glassTypeId,
      ingredients,
      equipment,
      instructions
    } = req.body;

    const existingDrink = await prisma.drink.findUnique({
      where: { id },
    });

    if (!existingDrink) {
      return res.status(404).json({ error: 'Drink not found' });
    }

    if (categories && Array.isArray(categories)) {
      const validCategories = [
        'COCKTAIL',
        'BEER',
        'WINE',
        'SPIRITS',
        'NON_ALCOHOLIC',
        'SPECIALTY',
      ];

      for (const cat of categories) {
        if (!validCategories.includes(cat.name)) {
          return res.status(400).json({
            error: `Invalid category: ${cat.name}`,
            validCategories,
          });
        }
      }
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
    };

    // Update glass type
    if (glassTypeId !== undefined) {
      updateData.glassType = glassTypeId 
        ? { connect: { id: glassTypeId } }
        : { disconnect: true };
    }

    // Handle categories update
    if (categories && Array.isArray(categories)) {
      await prisma.drinkCategory.deleteMany({
        where: { drinkId: id },
      });

      updateData.categories = {
        create: categories.map((cat, index) => ({
          categoryName: cat.name,
          isPrimary: cat.isPrimary || index === 0,
        })),
      };
    }

    // Handle ingredients update
    if (ingredients !== undefined && Array.isArray(ingredients)) {
      await prisma.drinkIngredient.deleteMany({
        where: { drinkId: id },
      });

      if (ingredients.length > 0) {
        updateData.ingredients = {
          create: ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        };
      }
    }

    // Handle equipment update
    if (equipment !== undefined && Array.isArray(equipment)) {
      await prisma.drinkEquipment.deleteMany({
        where: { drinkId: id },
      });

      if (equipment.length > 0) {
        updateData.equipment = {
          create: equipment.map(eq => ({
            equipmentId: eq.equipmentId,
          })),
        };
      }
    }

    // Handle instructions update
    if (instructions !== undefined && Array.isArray(instructions)) {
      await prisma.drinkInstruction.deleteMany({
        where: { drinkId: id },
      });

      if (instructions.length > 0) {
        updateData.instructions = {
          create: instructions.map((inst, index) => ({
            stepNumber: inst.stepNumber || index + 1,
            instruction: inst.instruction.trim(),
          })),
        };
      }
    }

    const updatedDrink = await prisma.drink.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    });

    res.json({
      message: 'Drink updated successfully',
      drink: updatedDrink,
    });
  } catch (error) {
    console.error('Error updating drink:', error);
    next(error);
  }
};

// Delete drink (no changes needed)
const deleteDrink = async (req, res, next) => {
  try {
    const { id } = req.params;

    const drink = await prisma.drink.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            events: true,
          },
        },
      },
    });

    if (!drink) {
      return res.status(404).json({ error: 'Drink not found' });
    }

    if (drink._count.orders > 0 || drink._count.events > 0) {
      return res.status(409).json({
        error: 'Cannot delete drink that has existing orders or is assigned to events',
        details: {
          orders: drink._count.orders,
          events: drink._count.events,
        },
      });
    }

    await prisma.drink.delete({
      where: { id },
    });

    res.json({
      message: 'Drink deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get popular drinks (updated include)
const getPopularDrinks = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const drinks = await prisma.drink.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        orders: {
          _count: 'desc',
        },
      },
      take: parseInt(limit),
    });

    res.json({ drinks });
  } catch (error) {
    next(error);
  }
};

// Get drink categories with counts (no changes)
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.drinkCategoryEnum.findMany();

    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.drinkCategory.count({
          where: { categoryName: cat.name },
        });
        return {
          name: cat.name,
          displayName: cat.displayName,
          icon: cat.icon,
          count,
        };
      })
    );

    res.json({ categories: withCounts });
  } catch (error) {
    next(error);
  }
};

// Search drinks (updated include)
const searchDrinks = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
      });
    }

    const drinks = await prisma.drink.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        glassType: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      drinks,
      count: drinks.length,
      query: q,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle a drink's availability for a specific event menu.
const toggleDrink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eventId, available } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: 'Event ID is required to toggle event-specific drink availability',
      });
    }

    const existingEventDrink = await prisma.eventDrink.findUnique({
      where: {
        eventId_drinkId: {
          eventId,
          drinkId: id,
        },
      },
    });

    if (!existingEventDrink) {
      return res.status(404).json({
        error: 'Drink is not available on this event menu',
      });
    }

    const nextAvailability =
      typeof available === 'boolean' ? available : !existingEventDrink.available;

    const eventDrink = await prisma.eventDrink.update({
      where: {
        eventId_drinkId: {
          eventId,
          drinkId: id,
        },
      },
      data: {
        available: nextAvailability,
      },
      include: {
        drink: true,
      },
    });

    emitDrinkAvailabilityUpdate(eventId, id, nextAvailability);

    res.json({
      message: 'Drink availability updated successfully',
      eventDrink,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDrinks,
  getDrinkById,
  getDrinksByCategory,
  createDrink,
  updateDrink,
  deleteDrink,
  getPopularDrinks,
  getCategories,
  searchDrinks,
  toggleDrink,
};
