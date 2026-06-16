const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// CI/test-only bootstrap for the PR test database. Do not use this as a production user path.
const prisma = new PrismaClient();

const email = 'ci-admin@example.com';
const name = 'CI Seed Host';
const throwawayPassword = 'ci-only-throwaway-password';

async function main() {
  const password = await bcrypt.hash(throwawayPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'ADMIN',
      password,
    },
    create: {
      email,
      name,
      role: 'ADMIN',
      password,
    },
    select: {
      email: true,
      role: true,
    },
  });

  console.log(`Created/updated CI-only ${user.role} seed host ${user.email}`);
}

main()
  .catch((error) => {
    console.error(`Failed to create CI seed host: ${error.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
