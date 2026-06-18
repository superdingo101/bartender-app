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
  it('includes drink ingredients for customer-facing liquor filters', () => {
    expect(eventMenuInclude.drinks.include.drink.include.ingredients).toEqual({
      include: {
        ingredient: true,
      },
    });
  });
});
