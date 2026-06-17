jest.mock('../services/database', () => ({
  prisma: {
    glassType: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = require('../services/database');
const {
  createGlassType,
  updateGlassType,
} = require('./glassEquipment.controller');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('glassEquipment controller glass type capacity handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['12', 12],
    ['12.0', 12],
    [12, 12],
    ['', null],
  ])('creates a glass type with capacity %p as %p', async (capacity, expectedCapacity) => {
    const glassType = { id: 'glass-1', name: 'Can, 12oz', capacity: expectedCapacity };
    prisma.glassType.create.mockResolvedValue(glassType);
    const req = {
      body: {
        name: 'Can, 12oz',
        description: '',
        imageUrl: '',
        capacity,
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await createGlassType(req, res, next);

    expect(prisma.glassType.create).toHaveBeenCalledWith({
      data: {
        name: 'Can, 12oz',
        description: null,
        imageUrl: null,
        capacity: expectedCapacity,
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Glass type created successfully',
      glassType,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('updates glass type capacity from a string to a number', async () => {
    const glassType = { id: 'glass-1', name: 'Can, 12oz', capacity: 12 };
    prisma.glassType.update.mockResolvedValue(glassType);
    const req = {
      params: { id: 'glass-1' },
      body: { capacity: '12.0' },
    };
    const res = mockResponse();
    const next = jest.fn();

    await updateGlassType(req, res, next);

    expect(prisma.glassType.update).toHaveBeenCalledWith({
      where: { id: 'glass-1' },
      data: { capacity: 12 },
    });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Glass type updated successfully',
      glassType,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
