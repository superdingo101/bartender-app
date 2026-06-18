jest.mock('./database', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('./socket', () => ({
  emitEventMenuUpdate: jest.fn(),
}));

const { eventMenuInclude } = require('./eventMenu');

describe('eventMenuInclude', () => {
  it('selects only public drink ingredient fields for customer-facing liquor filters', () => {
    expect(eventMenuInclude.drinks.include.drink.include.ingredients).toEqual({
      select: {
        ingredient: {
          select: {
            name: true,
            type: true,
            brand: true,
          },
        },
      },
    });
  });
});
