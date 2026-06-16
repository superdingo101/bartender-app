const { seedDemoContent } = require('./seed');

const makeDelegate = () => ({ upsert: jest.fn(async ({ create, where }) => ({ id: create?.id || where?.code || where?.name || 'mock-id', ...create })) });

describe('seedDemoContent', () => {
  it('does not create default admin or bartender users', async () => {
    const prisma = {
      drinkCategoryEnum: makeDelegate(),
      drink: makeDelegate(),
      drinkCategory: makeDelegate(),
      event: makeDelegate(),
      eventDrink: makeDelegate(),
      ingredient: makeDelegate(),
      user: { upsert: jest.fn(), create: jest.fn() },
    };

    await seedDemoContent(prisma);

    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.event.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { code: 'SUMMER2026' },
    }));
  });
});
