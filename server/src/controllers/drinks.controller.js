const { prisma } = require('../services/database');

// Get all drinks with filtering and search
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

    // Filter by category if provided
    const filtered = category
      ? drinks.filter(d => d.categories.some(dc => dc.category.name === category))
      : drinks;

    res.json({ drinks: filtered });
  } catch (error) {
    next(error);
  }
};

// Get single drink by ID
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
        ingredients: {
          include: {
            ingredient: true,
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

// Get drinks by category
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

// Create new drink (Bartender/Admin only)
const createDrink = async (req, res, next) => {
  try {
    const { name, description, categories, imageUrl } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Name is required',
      });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        error: 'At least one category is required',
      });
    }

    // Validate categories
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

    // Create drink with categories
    const drink = await prisma.drink.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        categories: {
          create: categories.map((cat, index) => ({
            categoryName: cat.name,
            isPrimary: cat.isPrimary || index === 0,
          })),
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

// Update drink (Bartender/Admin only)
const updateDrink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, categories, imageUrl } = req.body;

    // Check if drink exists
    const existingDrink = await prisma.drink.findUnique({
      where: { id },
    });

    if (!existingDrink) {
      return res.status(404).json({ error: 'Drink not found' });
    }

    // Validate category if provided
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

    // Update drink
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
    };

    // Handle categories update
    if (categories && Array.isArray(categories)) {
      // Delete existing categories
      await prisma.drinkCategory.deleteMany({
        where: { drinkId: id },
      });

      // Create new categories
      updateData.categories = {
        create: categories.map((cat, index) => ({
          categoryName: cat.name,
          isPrimary: cat.isPrimary || index === 0,
        })),
      };
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

// Delete drink (Admin only)
const deleteDrink = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if drink exists
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

    // Warn if drink has orders or is in events
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

// Get popular drinks (most ordered)
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

// Get drink categories with counts
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

// Search drinks
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
};