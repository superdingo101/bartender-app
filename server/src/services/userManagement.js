const bcrypt = require('bcryptjs');

const VALID_ROLES = ['ADMIN', 'BARTENDER', 'CUSTOMER'];
const MIN_PASSWORD_LENGTH = 8;

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const validateRole = (role) => {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(', ')}`);
  }
};

const validatePassword = (password) => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
};

const listUsers = (prisma) => prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  },
  orderBy: {
    email: 'asc',
  },
});

const createUser = async (prisma, {
  email,
  name,
  role,
  password,
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !name || !role) throw new Error('Email, name, and role are required');
  validateRole(role);
  validatePassword(password);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });
  if (existingUser) {
    throw new Error(`User ${normalizedEmail} already exists. Use the password or role update script instead.`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      role,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};

const updatePassword = async (prisma, { email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');
  validatePassword(password);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });
  if (!existingUser) throw new Error(`User ${normalizedEmail} was not found`);

  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: {
      email: normalizedEmail,
    },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });
};

const setRole = async (prisma, { email, role }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !role) throw new Error('Email and role are required');
  validateRole(role);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });
  if (!existingUser) throw new Error(`User ${normalizedEmail} was not found`);

  return prisma.user.update({
    where: {
      email: normalizedEmail,
    },
    data: {
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });
};

const deleteUser = async (prisma, { email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });
  if (!existingUser) throw new Error(`User ${normalizedEmail} was not found`);

  return prisma.user.delete({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
};

module.exports = {
  VALID_ROLES,
  MIN_PASSWORD_LENGTH,
  validateRole,
  validatePassword,
  listUsers,
  createUser,
  updatePassword,
  setRole,
  deleteUser,
};
