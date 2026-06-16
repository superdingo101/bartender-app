const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const {
  VALID_ROLES,
  listUsers,
  createUser,
  updatePassword,
  setRole,
  deleteUser,
} = require('../src/services/userManagement');

const prisma = new PrismaClient();

const parseArgs = (argv) => argv.reduce((acc, arg, index) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = argv[index + 1];
    acc[key] = next && !next.startsWith('--') ? next : true;
  }
  return acc;
}, {});

const promptHidden = (query) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const onData = (char) => {
    char = char.toString();
    if (char !== '\n' && char !== '\r' && char !== '\u0004') rl.output.write('\x1B[2K\x1B[200D' + query + '*'.repeat(rl.line.length));
  };
  process.stdin.on('data', onData);
  rl.question(query, (value) => {
    process.stdin.removeListener('data', onData);
    rl.close();
    rl.output.write('\n');
    resolve(value);
  });
});

const readConfirmedPassword = async () => {
  const password = await promptHidden('Password: ');
  const confirmation = await promptHidden('Confirm password: ');
  if (password !== confirmation) throw new Error('Passwords do not match');
  return password;
};

const requireArg = (args, name) => {
  if (!args[name] || args[name] === true) throw new Error(`Missing required --${name}`);
  return args[name];
};

const main = async () => {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === 'list') {
    const users = await listUsers(prisma);
    console.table(users.map(({ id, email, name, role, createdAt, updatedAt }) => ({ id, email, name, role, createdAt, updatedAt })));
    return;
  }

  if (command === 'create') {
    const user = await createUser(prisma, {
      email: requireArg(args, 'email'),
      name: requireArg(args, 'name'),
      role: requireArg(args, 'role'),
      password: await readConfirmedPassword(),
    });
    console.log(`Created ${user.role} user ${user.email}`);
    return;
  }

  if (command === 'password') {
    const user = await updatePassword(prisma, { email: requireArg(args, 'email'), password: await readConfirmedPassword() });
    console.log(`Updated password for ${user.email}`);
    return;
  }

  if (command === 'role') {
    const user = await setRole(prisma, { email: requireArg(args, 'email'), role: requireArg(args, 'role') });
    console.log(`Updated ${user.email} role to ${user.role}`);
    return;
  }

  if (command === 'delete') {
    const user = await deleteUser(prisma, { email: requireArg(args, 'email') });
    console.log(`Deleted user ${user.email}`);
    return;
  }

  throw new Error(`Unknown command. Use one of: list, create, password, role, delete. Roles: ${VALID_ROLES.join(', ')}`);
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
