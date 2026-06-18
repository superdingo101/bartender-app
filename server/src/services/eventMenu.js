const { prisma } = require('./database');
const { emitEventMenuUpdate } = require('./socket');

const eventMenuInclude = {
  drinks: {
    where: {
      available: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    include: {
      drink: {
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
      },
    },
  },
};

const getPublicEventMenu = (eventId) => prisma.event.findUnique({
  where: { id: eventId },
  include: eventMenuInclude,
});

const emitPublicEventMenuUpdate = async (eventId) => {
  const event = await getPublicEventMenu(eventId);
  if (event) {
    emitEventMenuUpdate(event);
  }
};

module.exports = {
  eventMenuInclude,
  getPublicEventMenu,
  emitPublicEventMenuUpdate,
};
