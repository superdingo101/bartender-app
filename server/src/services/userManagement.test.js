const bcrypt = require('bcryptjs');
const {
  createUser,
  updatePassword,
  setRole,
} = require('./userManagement');

const makePrisma = () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
});

describe('userManagement', () => {
  it('hashes the password and creates the requested role', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => data);

    const user = await createUser(prisma, {
      email: 'Admin@Example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: 'strong-password',
    });

    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('ADMIN');
    expect(user.password).not.toBe('strong-password');
    await expect(bcrypt.compare('strong-password', user.password)).resolves.toBe(true);
  });

  it('fails clearly when creating a duplicate user', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(createUser(prisma, {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: 'strong-password',
    })).rejects.toThrow('already exists. Use the password or role update script instead.');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('updates passwords with a new hash', async () => {
    const prisma = makePrisma();
    const oldHash = await bcrypt.hash('old-password', 10);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com', password: oldHash });
    prisma.user.update.mockImplementation(async ({ data }) => data);

    const result = await updatePassword(prisma, { email: 'user@example.com', password: 'new-password' });

    expect(result.password).not.toBe(oldHash);
    await expect(bcrypt.compare('new-password', result.password)).resolves.toBe(true);
  });

  it('validates allowed roles on role update', async () => {
    const prisma = makePrisma();

    await expect(setRole(prisma, { email: 'user@example.com', role: 'OWNER' }))
      .rejects.toThrow('Allowed roles: ADMIN, BARTENDER, CUSTOMER');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
