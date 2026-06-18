jest.mock('../services/database', () => ({
  prisma: {
    ingredient: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = require('../services/database');
const {
  createIngredient,
  updateIngredient,
} = require('./ingredients.controller');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ingredients controller create and edit handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates ingredients with numeric string values parsed for Prisma', async () => {
    const ingredient = {
      id: 'ingredient-1',
      name: 'Lime Juice',
      type: 'Juice',
      unit: 'oz',
      quantity: 25.5,
      minQuantity: 5,
      bottlePrice: 9.99,
    };
    prisma.ingredient.create.mockResolvedValue(ingredient);
    const req = {
      body: {
        name: ' Lime Juice ',
        type: ' Juice ',
        brand: '',
        unit: ' oz ',
        quantity: '25.5',
        minQuantity: '5',
        bottlePrice: '9.99',
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await createIngredient(req, res, next);

    expect(prisma.ingredient.create).toHaveBeenCalledWith({
      data: {
        name: 'Lime Juice',
        type: 'Juice',
        brand: null,
        unit: 'oz',
        quantity: 25.5,
        minQuantity: 5,
        bottlePrice: 9.99,
      },
      include: {
        purchaseHistory: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ingredient created successfully',
      ingredient,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('updates ingredients with edited fields and numeric string values parsed for Prisma', async () => {
    const ingredient = {
      id: 'ingredient-1',
      name: 'Fresh Lime Juice',
      type: 'Juice',
      unit: 'ml',
      quantity: 750,
      minQuantity: 100,
      bottlePrice: null,
    };
    prisma.ingredient.update.mockResolvedValue(ingredient);
    const req = {
      params: { id: 'ingredient-1' },
      body: {
        name: ' Fresh Lime Juice ',
        type: ' Juice ',
        brand: ' ',
        unit: ' ml ',
        quantity: '750',
        minQuantity: '100',
        bottlePrice: '',
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateIngredient(req, res, next);

    expect(prisma.ingredient.update).toHaveBeenCalledWith({
      where: { id: 'ingredient-1' },
      data: {
        name: 'Fresh Lime Juice',
        type: 'Juice',
        brand: null,
        unit: 'ml',
        quantity: 750,
        minQuantity: 100,
        bottlePrice: null,
      },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
        },
      },
    });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ingredient updated successfully',
      ingredient,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a conflict when editing an ingredient to a duplicate name', async () => {
    prisma.ingredient.update.mockRejectedValue({ code: 'P2002' });
    const req = {
      params: { id: 'ingredient-1' },
      body: { name: 'Simple Syrup' },
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateIngredient(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'An ingredient with this name already exists',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
