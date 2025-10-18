const { prisma } = require('../services/database');

// Get all ingredients
const getAllIngredients = async (req, res, next) => {
  try {
    const { type, search } = req.query;

    const where = {
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const ingredients = await prisma.ingredient.findMany({
      where,
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
        },
        _count: {
          select: { drinks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ ingredients });
  } catch (error) {
    next(error);
  }
};

// Get single ingredient with full purchase history
const getIngredientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
        },
        drinks: {
          include: {
            drink: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { drinks: true },
        },
      },
    });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({ ingredient });
  } catch (error) {
    next(error);
  }
};

// Create new ingredient
const createIngredient = async (req, res, next) => {
  try {
    const { name, type, brand, unit, quantity, minQuantity, bottlePrice } = req.body;

    if (!name || !type || !unit) {
      return res.status(400).json({
        error: 'Name, type, and unit are required',
      });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        brand: brand?.trim() || null,
        unit: unit.trim(),
        quantity: quantity || 0,
        minQuantity: minQuantity || 0,
        bottlePrice: bottlePrice || null,
      },
      include: {
        purchaseHistory: true,
      },
    });

    res.status(201).json({
      message: 'Ingredient created successfully',
      ingredient,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'An ingredient with this name already exists',
      });
    }
    next(error);
  }
};

// Update ingredient
const updateIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, brand, unit, quantity, minQuantity, bottlePrice } = req.body;

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type: type.trim() }),
        ...(brand !== undefined && { brand: brand?.trim() || null }),
        ...(unit && { unit: unit.trim() }),
        ...(quantity !== undefined && { quantity }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(bottlePrice !== undefined && { bottlePrice }),
      },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
        },
      },
    });

    res.json({
      message: 'Ingredient updated successfully',
      ingredient,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    next(error);
  }
};

// Delete ingredient
const deleteIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        _count: {
          select: { drinks: true },
        },
      },
    });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    if (ingredient._count.drinks > 0) {
      return res.status(409).json({
        error: 'Cannot delete ingredient that is used in drinks',
        details: { drinks: ingredient._count.drinks },
      });
    }

    await prisma.ingredient.delete({ where: { id } });

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add purchase history entry
const addPurchaseHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, quantity, unit, supplier, notes, purchaseDate } = req.body;

    if (!price || !quantity || !unit) {
      return res.status(400).json({
        error: 'Price, quantity, and unit are required',
      });
    }

    const purchase = await prisma.ingredientPurchase.create({
      data: {
        ingredientId: id,
        price,
        quantity,
        unit: unit.trim(),
        supplier: supplier?.trim() || null,
        notes: notes?.trim() || null,
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
      },
    });

    // Optionally update ingredient quantity
    await prisma.ingredient.update({
      where: { id },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    });

    res.status(201).json({
      message: 'Purchase history added successfully',
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

// Get ingredient types (for filtering/categorization)
const getIngredientTypes = async (req, res, next) => {
  try {
    const types = await prisma.ingredient.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });

    res.json({ types: types.map(t => t.type) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  addPurchaseHistory,
  getIngredientTypes,
};