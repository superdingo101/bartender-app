const { seedDemoContent } = require('./seed');

const makeDelegate = () => ({
  upsert: jest.fn(async ({ create, where, update }) => ({
    id: create?.id || where?.code || where?.name || 'mock-id',
    ...create,
    ...update,
  })),
});

const makePrisma = (host) => ({
  drinkCategoryEnum: makeDelegate(),
  drink: makeDelegate(),
  drinkCategory: makeDelegate(),
  event: makeDelegate(),
  eventDrink: makeDelegate(),
  ingredient: makeDelegate(),
  user: {
    findUnique: jest.fn().mockResolvedValue(host),
    upsert: jest.fn(),
    create: jest.fn(),
  },
});

describe('seedDemoContent', () => {
  it('does not create users and creates SUMMER2026 with an existing hostId', async () => {
    const prisma = makePrisma({ id: 'host-1', email: 'admin@example.com', role: 'ADMIN' });

    await seedDemoContent(prisma, { hostEmail: 'Admin@Example.com' });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
      select: { id: true, email: true, role: true },
    });
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.event.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { code: 'SUMMER2026' },
      create: expect.objectContaining({ hostId: 'host-1' }),
      update: expect.objectContaining({ hostId: 'host-1' }),
    }));
  });

  it('fails clearly when DEMO_EVENT_HOST_EMAIL is missing', async () => {
    const prisma = makePrisma(null);

    await expect(seedDemoContent(prisma, { hostEmail: '' }))
      .rejects.toThrow('DEMO_EVENT_HOST_EMAIL is required to seed the demo event');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('fails clearly when the host user does not exist', async () => {
    const prisma = makePrisma(null);

    await expect(seedDemoContent(prisma, { hostEmail: 'missing@example.com' }))
      .rejects.toThrow('Demo event host missing@example.com was not found');
  });

  it('fails clearly when the host user is not ADMIN or BARTENDER', async () => {
    const prisma = makePrisma({ id: 'customer-1', email: 'customer@example.com', role: 'CUSTOMER' });

    await expect(seedDemoContent(prisma, { hostEmail: 'customer@example.com' }))
      .rejects.toThrow('must have role ADMIN or BARTENDER');
  });
});
